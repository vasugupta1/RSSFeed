# RSSFeed

An AI-powered RSS news aggregator that subscribes to RSS feeds, crawls articles, summarises them using locally-hosted LLMs (via Ollama), and builds a knowledge graph (ontology) connecting topics across articles. Think of it as a self-hosted Feedly with built-in AI summarisation.

## What It Does

1. **Subscribe to RSS feeds** — add any RSS/Atom feed URL and the system automatically fetches and parses articles
2. **Crawl & extract content** — articles are scraped and converted to clean markdown using a two-tier crawling strategy (fast HTTP fetch → headless browser fallback)
3. **AI summarisation** — each article is summarised into concise bullet points with extracted keywords, using a locally-hosted `llama3.2` model
4. **Ontology extraction** *(work in progress)* — entities and relationships are extracted from articles using `deepseek-r1:7b` to build a knowledge graph showing how topics connect across different articles
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
│  React/Vite │──▶│   Chi Router │──▶│    FastAPI + LangChain   │
│  :8003      │   │   :8002      │   │    :8001                 │
└─────────────┘   └──────┬───────┘   └────────┬─────────────────┘
                         │                    │
                         ▼                    ▼
                  ┌─────────────┐     ┌──────────────┐
                  │   MongoDB   │     │    Ollama     │
                  │  (articles  │     │  llama3.2    │
                  │   & feeds)  │     │  deepseek-r1 │
                  └─────────────┘     └──────────────┘
                                             │
                  ┌─────────────┐            │
                  │ PostgreSQL  │◀───────────┘
                  │ Apache AGE  │   (ontology - WIP)
                  │ (graph DB)  │
                  └─────────────┘
```

---

## Layers

### 1. Frontend — React + TypeScript + Vite

| | |
|---|---|
| **Path** | `frontend/` |
| **Tech** | React 19, TypeScript 6, Vite 8, TailwindCSS 4 |
| **Purpose** | Feedly-style RSS reader UI |

The frontend provides a three-column layout: a sidebar for feed navigation and filters, a middle column for article cards, and a right panel for AI-generated summaries. It supports dark/light mode, search, starring, and read/unread tracking.

All data flows through the Go BFF via a Vite dev proxy (`/api/*` → Go backend). On mount it fetches all cached articles; when a user clicks an article, it either displays the pre-loaded summary or triggers an on-demand crawl + summarisation.

**Key dependencies:** `react`, `vite`, `tailwindcss`, `typescript`

---

### 2. Go Backend (BFF) — Chi Router + MongoDB

| | |
|---|---|
| **Path** | `backend/` |
| **Tech** | Go 1.25, go-chi/chi v5, MongoDB driver v2 |
| **Purpose** | Backend-for-Frontend — mediates between the React app and the Python AI service |

The BFF handles RSS feed management and article caching. It follows a clean layered architecture:

```
internal/
├── background/     → Background workers (article fetching pipeline)
├── client/         → HTTP client for the AI service
├── config/         → Environment variable loading
├── handler/        → HTTP request handlers
├── models/         → Request/response DTOs
├── repository/     → MongoDB data access layer
├── server/         → HTTP server + route registration
└── service/        → Business logic layer
```

**API routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthcheck` | Health check |
| `POST` | `/api/feed` | Add/subscribe to an RSS feed URL |
| `GET` | `/api/articles` | Get all cached article summaries |
| `POST` | `/api/crawler` | Crawl + summarise a single URL (with cache check) |
| `DELETE` | `/api/article` | Delete an article by URL |

**Data flow:**
1. User adds an RSS feed URL → BFF fetches the RSS XML, parses items, saves the feed to MongoDB, and pushes articles into a buffered channel
2. A background worker reads from the channel → calls the Python AI service → saves the AI-generated summary to MongoDB
3. On startup, another background worker reloads all saved feeds and re-fetches new articles

**Key dependencies:** `go-chi/chi`, `mongo-driver/v2`

---

### 3. Python AI Service — FastAPI + LangChain + Crawl4AI

| | |
|---|---|
| **Path** | `ai/` |
| **Tech** | Python 3.13, FastAPI, Uvicorn, LangChain, Ollama, Crawl4AI, Playwright |
| **Purpose** | Web scraping, AI-powered article summarisation, and ontology extraction |

This is the intelligence layer. It exposes a single crawl endpoint that:

1. **Crawls the URL** using a two-tier strategy:
   - *Fast path:* `httpx` direct fetch with 5s timeout → parse HTML to markdown
   - *Slow path:* Full headless browser crawl via Playwright (if the fast path fails)
2. **Summarises the article** using `llama3.2:latest` via LangChain's structured output:
   - Extracts: title, bullet-point summary, keywords, country of origin
3. **Extracts ontology** *(WIP)* using `deepseek-r1:7b`:
   - Identifies entities (organisations, people, technologies, concepts)
   - Maps relationships between them (DEVELOPED, EMPLOYED_BY, IS_A_SUBFIELD_OF, etc.)

**API routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/healthcheck` | Health check |
| `GET` | `/api/crawl?url=` | Crawl URL → summarise → extract ontology → return results |

**Key dependencies:** `fastapi`, `uvicorn`, `crawl4ai`, `langchain-ollama`, `langchain-core`, `playwright`, `httpx`, `pydantic`, `beautifulsoup4`

---

### 4. Databases

#### MongoDB
- **Image:** `mongo:8.2.9-noble`
- **Database:** `rssfeedurl`
- **Collections:**
  - `feedurl` — RSS feed subscriptions
  - `feedarticle` — Cached article summaries (url, title, summary, keywords, created_at)
- **UI:** MongoExpress for visual inspection

#### PostgreSQL + Apache AGE *(work in progress)*
- **Image:** `apache/age:latest`
- **Database:** `rssfeedontology`
- **Tables:** `entities` and `relationships` (defined in `migrations/`)
- **Purpose:** Knowledge graph storage for the ontology feature
- **UI:** PgAdmin for visual inspection
- **Status:** Migrations are currently commented out in the Aspire apphost; the AI service extracts ontology data but does not yet persist it to PostgreSQL

---

### 5. AI Models (Ollama)

| Model | Purpose | Config |
|-------|---------|--------|
| `llama3.2:latest` | Article summarisation (title, summary, keywords, country) | temperature 0.0, structured JSON output |
| `deepseek-r1:7b` | Ontology extraction (entities + relationships) | temperature 0.0, structured JSON output |

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

That's it. Aspire will:

1. Pull and start **MongoDB** (with MongoExpress UI)
2. Pull and start **PostgreSQL / Apache AGE** (with PgAdmin)
3. Pull and start **Ollama** (ROCm build) and download the `llama3.2` and `deepseek-r1:7b` models
4. Start the **Python AI service** on port `8001`
5. Start the **Go BFF** on port `8002`
6. Start the **React frontend** (Vite dev server) on port `8003`
7. Wire up all service discovery, environment variables, and network connections automatically

Open the **Aspire dashboard** to monitor all services, view logs, and check health status.

### Environment Variables

All environment variables are managed automatically by Aspire's service discovery. The key ones include:

| Variable | Service | Description |
|----------|---------|-------------|
| `CHAT_URI` | AI | Ollama endpoint for the chat/summarisation model |
| `CHAT_MODEL` | AI | Model name (e.g. `llama3.2:latest`) |
| `ONOTOLOGY_URI` | AI | Ollama endpoint for the ontology model |
| `ONOTOLOGY_MODEL` | AI | Model name (e.g. `deepseek-r1:7b`) |
| `ConnectionStrings__rssfeedurl` | BFF, AI | MongoDB connection string |
| `services__rssfeedai__https__0` | BFF | AI service URL |
| `services__rssfeedwebapp__http__0` | Frontend | BFF URL (for Vite proxy) |

---

## Technology Summary

| Layer | Technology |
|-------|------------|
| Orchestration | .NET Aspire |
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Backend (BFF) | Go, Chi Router, MongoDB Driver |
| AI Service | Python, FastAPI, LangChain, Crawl4AI, Playwright |
| LLMs | Ollama (llama3.2, deepseek-r1:7b) |
| Article Storage | MongoDB |
| Graph Storage | PostgreSQL + Apache AGE |
| Containerisation | Docker (managed by Aspire) |