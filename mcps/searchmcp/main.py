import os 
from mcp.server.fastmcp import FastMCP
from typing import List, Dict, Any
from ddgs import DDGS

PORT = int(os.environ.get("MCP_SERVER_PORT", "9091"))

mcp = FastMCP(
    name = "SEARCHMCPSERVER",
    port= PORT,
)

@mcp.tool()
def health_check():
    healthcheck = {}
    healthcheck["status"] = "ok"
    healthcheck["port"] = PORT
    return healthcheck

@mcp.tool()
def web_search(query:str, max_results:int = 5) -> List[Dict[str, Any]]:
    """
    Search the web using DuckDuckGo.
    
    Args:
        query: Search query string.
        max_results: Number of search results to return (default 5, max 10).
    """
    results = []
    limit = min(max_results, 10)
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=limit):
            results.append({
                "title": r.get("title"),
                "url": r.get("href"),
                "snippet": r.get("body")
            })
            
    return results

if __name__ == "__main__":
    mcp.run(transport="streamable-http")

