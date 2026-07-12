# Ontology Pipeline Analysis & Recommendations

Analysis of the draft workflow in `crawlresultprocessing.py` and recommendations for alternative approaches.

---

## 1. Current Draft Workflow (Comments in `_process_message`)

```python
'''1. Get article crawl result'''
'''2. use ontology service to get current doc ontology and keywords'''
'''3. for each entities and relationship get doc from vector database'''
'''4. pass all the docs and create an update new ontology on it'''
```

---

## 2. Step-by-Step Evaluation

### Step 1 — "Get article crawl result"
- ✅ Makes sense. The consumer receives the message from RabbitMQ via `VectorEmbeddingMessanger.comsume()`.
- ⚠️ **Note**: Previously `app.py` was publishing the raw `ArticleAnalysis` Pydantic object, causing a `JSON serializable` error. This was fixed by calling `.model_dump()` before publishing. The queue message now contains the structured analysis dict (title, summary, keywords, etc.) rather than raw markdown — which is a much better queue payload.

### Step 2 — "Use ontology service to get current doc ontology and keywords"
- ✅ The idea is sound — call `ArticleOntologyService.extract_ontology()` on the crawl result.
- ⚠️ **Problem**: `app.py` already calls `RSSAnalyserService` to extract keywords/summary during the HTTP request. Running ontology extraction here means **two separate LLM calls** on the same text. Consider combining them or passing the already-extracted metadata (which is now what the queue message contains post-fix).

### Step 3 — "For each entities and relationship get doc from vector database"
- ❌ **This is the main problem.** If ontology extraction returns 10 entities and 15 relationships, that's **25 separate vector DB queries**. Each query embeds the entity name, performs cosine similarity search, and returns documents. This is:
  - **Slow**: 25 round-trips per message.
  - **Expensive**: 25 embedding API calls per message.
  - **Semantically wrong**: Vector search is for semantic similarity (`"AI regulation in EU"` ≈ `"European artificial intelligence policy"`), not for exact entity lookup (`"Google"` → find documents mentioning Google). For that, use a SQL keyword index or full-text search on the `document_embeddings` table.

### Step 4 — "Pass all the docs and create/update new ontology"
- ⚠️ **Problematic at scale.** Concatenating the main article + N retrieved documents into a single LLM prompt will:
  - Blow up the context window (especially with local Ollama models).
  - Make extraction noisy and less accurate.
  - Be unnecessary — graph databases like Apache AGE handle merging naturally. If Article A produces `(Google)-[ACQUIRED]->(YouTube)` and Article B produces `(YouTube)-[HAS_CEO]->(Neal Mohan)`, the graph **automatically connects** Google → YouTube → Neal Mohan through shared nodes via `ON CONFLICT` / `MERGE`. No need to feed both articles to the LLM together.

---

## 3. Recommended Alternative Approaches

### Approach A: Incremental Graph Construction ⭐ Recommended

The simplest and most performant option. Don't retrieve related docs at all — just extract and save.

```
Message arrives → Fetch article content → LLM extracts ontology → Save to graph DB (MERGE)
```

The graph database does the heavy lifting of entity resolution via `ON CONFLICT` / `MERGE`. `GraphService.save_ontology()` already implements this with `ON CONFLICT (name) DO UPDATE` for entities and `ON CONFLICT ... DO NOTHING` for relationships.

```python
def _process_message(self, result: str) -> None:
    # 1. Extract ontology from this article alone
    ontology = self.onotlogy_service.extract_ontology(result)

    # 2. Save to graph — DB merges overlapping entities automatically
    self.graphy_service.save_ontology(ontology, article_title="...")
```

**Pros**: Fast, simple, one LLM call per article, zero DB reads during ingestion.
**Cons**: Won't resolve entity name variations across articles (e.g., "MSFT" vs "Microsoft").

---

### Approach B: Single Vector Lookup for Context (Matches `doc.md` Service 2)

Do **one** similarity search using the article's embedding (not N searches per entity), then use the top matches as context.

```
Article → Embed full article → 1 vector query → Top 3-5 related summaries
→ LLM gets (article + related summaries) → Extract ontology → Save to graph
```

**Key difference from current comment**: One query using the article's overall embedding, not N queries per entity.

**Pros**: The LLM can resolve cross-document entity references ("MSFT" = "Microsoft") since it sees related articles.
**Cons**: Requires pgvector to be populated first (Service 1 from `doc.md` must run before Service 2).

---

### Approach C: Post-Extraction Entity Resolution

Extract first, then resolve duplicates — avoids sending huge contexts to the LLM.

```
1. LLM extracts ontology from article alone → candidate entities
2. SQL query: SELECT name FROM entities WHERE name ILIKE ANY(candidate_names)
3. Small LLM call: "Map these candidates to existing entities if they match"
4. Save resolved ontology to graph
```

**Pros**: Precise entity deduplication, small LLM prompts, uses cheap SQL not vector search.
**Cons**: Extra LLM call (but a very small/cheap one).

---

## 4. Comparison

| Metric | Current Draft | A: Incremental | B: Single Vector | C: Entity Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **LLM Latency** | 🔴 Very High | 🟢 Low | 🟡 Moderate | 🟢 Low |
| **DB Load** | 🔴 High (N queries) | 🟢 Low (writes only) | 🟢 Low (1 query) | 🟢 Low (SQL index) |
| **Token Cost** | 🔴 Very High | 🟢 Low | 🟡 Moderate | 🟢 Low |
| **Complexity** | 🟡 Moderate | 🟢 Simple | 🟡 Moderate | 🟡 Moderate |
| **Entity Merging** | 🟡 Unreliable | 🟡 DB constraints only | 🟢 Good | 🟢 Good |

---

## 5. Bug Fix Log

### `ArticleAnalysis is not JSON serializable` (Fixed 2026-07-12)

**Cause**: `app.py` was passing the raw Pydantic `ArticleAnalysis` object to `messanger.publish()`, which internally calls `json.dumps()`. `json.dumps()` cannot serialize Pydantic models.

**Fix**: Changed `messanger.publish(article_analysis)` → `messanger.publish(article_analysis.model_dump())` in `app.py`. Pydantic's `.model_dump()` converts the object to a plain `dict` that `json.dumps()` can handle.
