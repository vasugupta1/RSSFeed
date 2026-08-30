# RSSFeed

An AI-powered RSS news aggregator that subscribes to RSS feeds, crawls articles, summarises them using locally-hosted LLMs (via Ollama), and builds a knowledge graph (ontology) connecting topics across articles. Think of it as a self-hosted Feedly with built-in AI summarisation.

## What It Does

1. **Subscribe to RSS feeds** — add any RSS/Atom feed URL and the system automatically fetches and parses articles
2. **Crawl & extract content** — articles are scraped and converted to clean markdown using a two-tier crawling strategy (fast HTTP fetch → headless browser fallback)
3. **AI summarisation** — each article is summarised into concise bullet points with extracted keywords, using a locally-hosted LLM (e.g. `gemma4:e2b`)
4. **Ontology extraction** — entities and relationships are extracted from articles to build a knowledge graph (using Neo4j) showing how topics connect across different articles
5. **Reader UI** — a Feedly-style React frontend for browsing feeds, reading AI summaries, starring articles, and searching

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     .NET Aspire Orchestrator                    │
│              (single command to start everything)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ provisions & wires up
       ┌───────────────────┼───────────────────────┐
       ▼                   ▼                       ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐
│  Frontend   │   │   Go BFF     │   │    Python AI Service     │
│  React/Vite │──▶│   Chi Router │──▶│    FastAPI + LangGraph   │
│  :8003      │   │   :8002      │   │    :8001                 │
└─────────────┘   └──────┬───────┘   └────────┬─────────────────┘
                         │                    │
                  ┌──────▼───────┐            │
                  │   RabbitMQ   │◀───────────┘
                  │  (messaging) │
                  └──────┬───────┘
                         ▼
                  ┌─────────────┐     ┌──────────────┐
                  │   MongoDB   │     │    Ollama    │
                  │  (articles  │     │  gemma4:e2b  │
                  │   & feeds)  │     │  nomic-embed │
                  └─────────────┘     └──────────────┘
                                             │
                  ┌─────────────┐            │
                  │    Neo4j    │◀───────────┘
                  │  (ontology) │   
                  └─────────────┘
                  ┌─────────────┐
                  │  pgvector   │
                  │ (embeddings)│
                  └─────────────┘
```

---

## Layers

### 1. Frontend — React + TypeScript + Vite

| | |
|---|---|
| **Path** | `frontend/` |
| **Tech** | React 19, TypeScript 6, Vite 8, TailwindCSS 4, Vitest |
| **Purpose** | Feedly-style RSS reader UI |

The frontend provides a three-column layout: a sidebar for feed navigation and filters, a middle column for article cards, and a right panel for AI-generated summaries. It supports dark/light mode, search, starring, and read/unread tracking.
Recently, automated component testing using Vitest was added for key components (Header, Sidebar, BulletList) and utilities (`feedParser`).

All data flows through the Go BFF via a Vite dev proxy (`/api/*` → Go backend). On mount it fetches all cached articles; when a user clicks an article, it either displays the pre-loaded summary or triggers an on-demand crawl + summarisation.

**Key dependencies:** `react`, `vite`, `tailwindcss`, `typescript`, `vitest`

---

### 2. Go Backend (BFF) — Chi Router + MongoDB + RabbitMQ

| | |
|---|---|
| **Path** | `backend/` |
| **Tech** | Go 1.25, go-chi/chi v5, MongoDB driver v2, RabbitMQ |
| **Purpose** | Backend-for-Frontend — mediates between the React app and the Python AI service |

The BFF handles RSS feed management and article caching. It follows a clean layered architecture:

```
internal/
├── background/     → Background workers (article fetching pipeline)
├── config/         → Environment variable loading
├── handler/        → HTTP request handlers
├── models/         → Request/response DTOs
├── repository/     → MongoDB data access layer
├── server/         → HTTP server + route registration
└── service/        → Business logic layer
```

**Data flow:**
1. User adds an RSS feed URL → BFF fetches the RSS XML, parses items, saves the feed to MongoDB
2. The BFF publishes events to RabbitMQ queues (e.g., `rssfeed-article-crawl-event`) 
3. The Python AI service consumes the events asynchronously and performs heavy processing (crawling, research, ontology extraction)
4. On startup, another background worker reloads all saved feeds and re-fetches new articles

**Key dependencies:** `go-chi/chi`, `mongo-driver/v2`, `rabbitmq`

---

### 3. Python AI Service — FastAPI + LangGraph + Crawl4AI + RabbitMQ

| | |
|---|---|
| **Path** | `ai/` |
| **Tech** | Python 3.13, FastAPI, Uvicorn, LangGraph, Ollama, Crawl4AI, Playwright, aio_pika |
| **Purpose** | Web scraping, AI-powered article summarisation, and ontology extraction |

This is the intelligence layer, recently refactored to use robust async messaging and LangGraph workflows:

1. **Messaging Integration**: Uses `aio_pika` to consume RabbitMQ messages and dispatch them to the appropriate LangGraph state graphs.
2. **LangGraph State Graphs**: Workflows are modeled as graphs (`crawlurlgraph`, `researcheventgraph`, `ontologygraph`) for resilient multi-step execution.
3. **Crawls the URL** using a two-tier strategy:
   - *Fast path:* `httpx` direct fetch with 5s timeout → parse HTML to markdown
   - *Slow path:* Full headless browser crawl via Playwright (if the fast path fails)
4. **Summarises the article** using LLMs via LangChain's structured output to extract title, bullet-point summary, keywords, and country.
5. **Extracts ontology** using LLMs to build a knowledge graph of entities and relationships (persisted to Neo4j).

**Key dependencies:** `fastapi`, `uvicorn`, `crawl4ai`, `langchain-ollama`, `langgraph`, `playwright`, `httpx`, `aio_pika`

---

### 4. Databases and Messaging

#### MongoDB
- **Image:** `mongo:8.2.9-noble`
- **Database:** `rssfeedurl`
- **Purpose:** Storage for RSS feeds and cached article summaries.
- **UI:** MongoExpress for visual inspection

#### Neo4j
- **Image:** `neo4j:5.19`
- **Database:** graph database with `apoc` plugins
- **Purpose:** Primary knowledge graph storage for the ontology feature.

#### PostgreSQL / pgvector
- **Image:** `pgvector/pgvector:pg15` & `apache/age:latest`
- **Purpose:** Vector embeddings storage and alternative relational/graph storage.
- **UI:** PgAdmin for visual inspection

#### RabbitMQ
- **Image:** `rabbitmq:4.3-management`
- **Purpose:** Async event bus for decoupled communication between the Go BFF and Python AI service.

---

### 5. AI Models (Ollama)

| Model | Purpose |
|-------|---------|
| `gemma4:e2b` | Primary LLM for article summarisation and ontology extraction |
| `nomic-embed-text` | Vector embeddings for semantic search |

Ollama is configured with ROCm for AMD GPU acceleration. The Aspire orchestrator handles GPU passthrough (`/dev/kfd`, `/dev/dri`) and sets context length to 16384 tokens.

An **OpenWebUI** instance is also provisioned for interactive model testing.

---

## How to Run Locally

### Prerequisites

- [.NET Aspire CLI](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/setup-tooling) installed
- Docker / Podman running
- An AMD GPU with ROCm support (for Ollama GPU acceleration), or modify the Aspire apphost to use the CPU-only Ollama image

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/vasugupta1/RSSFeed.git
cd RSSFeed

# 2. Navigate to the Aspire orchestrator
cd rssfeed-aspire

# 3. Restore dependencies and run everything
aspire restore && aspire run
```

That's it. Aspire will automatically provision and wire up MongoDB, Neo4j, RabbitMQ, PostgreSQL, Ollama, Go BFF, Python AI Service, and the React frontend.

Open the **Aspire dashboard** to monitor all services, view logs, and check health status.

---

## Technology Summary

| Layer | Technology |
|-------|------------|
| Orchestration | .NET Aspire |
| Frontend | React, TypeScript, Vite, TailwindCSS, Vitest |
| Backend (BFF) | Go, Chi Router, MongoDB Driver |
| AI Service | Python, FastAPI, LangGraph, Crawl4AI, Playwright, aio_pika |
| Messaging | RabbitMQ |
| LLMs | Ollama (gemma4:e2b, nomic-embed-text) |
| Article Storage | MongoDB |
| Graph/Vector Storage | Neo4j, PostgreSQL (pgvector, Apache AGE) |
| Containerisation | Docker (managed by Aspire) |