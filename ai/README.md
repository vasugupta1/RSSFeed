# RSSFeed AI Service

This is a Python-based FastAPI microservice that provides artificial intelligence and high-performance scraping capabilities to the RSSFeed aggregator application.

## Key Features

- **Asynchronous Web Crawling**: Uses `crawl4ai` (`AsyncWebCrawler`) to fetch, parse, and convert web pages into clean, structured Markdown format, stripping out unnecessary boilerplates, ads, and scripts.
- **FastAPI Endpoint**: Exposes a REST API (`POST /api/crawl`) for retrieving scraped content on demand.
- **.NET Aspire Orchestration**: Integrated seamlessly with the main .NET Aspire host, serving as a background AI resource.
- **Python 3.13 Toolchain**: Locked to Python 3.13 for package compatibility and optimized async performance.

## Prerequisites

- **Python 3.13** (managed via `mise` or your system toolchain)
- **Virtual Environment (`.venv`)** set up inside this folder

## Installation & Setup

If running standalone, you can set up and run the service manually:

```bash
# 1. Recreate the venv with Python 3.13 (if not already done)
python3.13 -m venv .venv

# 2. Activate the virtual environment
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install Playwright browsers (required by crawl4ai)
playwright install
```

## Running the App

### Standalone Mode
Run the FastAPI server using the virtual environment's python interpreter:
```bash
./.venv/bin/python app.py
```
The server will start on `http://localhost:8000`.

### Orchestrated Mode (via Aspire)
When launching the main RSSFeed solution via .NET Aspire, this service is automatically managed, initialized, and run on a configured dynamic port.

## API Endpoints

### 1. Health Check
- **Route**: `GET /healthcheck`
- **Response**: `{"status": "healthy"}`

### 2. Crawl URL
- **Route**: `POST /api/crawl?url=<url>`
- **Response**: Returns the raw scraped markdown representation of the target web page.
