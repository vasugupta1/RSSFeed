import logging
from ddgs import DDGS
from typing import List
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SearchResult(BaseModel):
    url: str = Field(description="The URL of the search result.")
    title: str = Field(description="The title of the search result.")
    snippet: str = Field(description="A short snippet or description of the search result.")


class SearchService:
    def __init__(self) -> None:
        logger.info("SearchService initialised")

    def web_search(self, query: str, max_results: int = 5) -> List[SearchResult]:
        limit = min(max_results, 10)
        logger.info("Starting web search — query=%r, max_results=%d (capped to %d)", query, max_results, limit)

        results: List[SearchResult] = []

        try:
            with DDGS() as ddgs:
                raw_results = list(ddgs.text(query, max_results=limit))

            logger.info("DuckDuckGo returned %d raw results", len(raw_results))

            for i, r in enumerate(raw_results):
                url = r.get("href")
                title = r.get("title", "")
                snippet = r.get("body", "")

                if not url or not url.strip():
                    logger.warning("Result[%d] skipped — missing or empty URL. Raw result: %r", i, r)
                    continue

                url = url.strip()
                result = SearchResult(url=url, title=title, snippet=snippet)
                results.append(result)
                logger.debug("Result[%d] accepted — url=%s, title=%r", i, url, title)

        except Exception as e:
            logger.error("Web search failed for query=%r: %s", query, e, exc_info=True)

        logger.info("Web search complete — %d valid results returned for query=%r", len(results), query)
        return results