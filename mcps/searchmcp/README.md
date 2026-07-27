# CrawlMCP

A FastMCP server for web crawling.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
# stdio transport (default, for MCP clients)
python server.py

# SSE transport (for HTTP access)
python server.py --transport sse
```

## Dev / Inspector

```bash
mcp dev server.py
```
