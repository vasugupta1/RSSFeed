import logging
from ddgs import DDGS
from typing import AsyncGenerator, Iterator, Any, List
from pydantic import BaseModel, Field
import asyncio

logger = logging.getLogger(__name__)

class SearchResult(BaseModel):
    url: str = Field(description="The URL of the search result.")
    title: str = Field(description="The title of the search result.")
    snippet: str = Field(description="A short snippet or description of the search result.")

class SearchService:
    def __init__(self) -> None:
        logger.info("SearchService initialised")

    async def web_search_keywords(self, key_words: List[str], max_results : int = 5) -> AsyncGenerator[SearchResult]:
        async def _collect(word:str) -> List[SearchResult]:
            return [res async for res in self.web_search(word, max_results=max_results)]

        nested_search_results = await asyncio.gather(*[_collect(word) for word in key_words])

        for result_list in nested_search_results:
            for result in result_list:
                yield result
    
    async def web_search(self, query: str, max_results: int = 5) -> AsyncGenerator[SearchResult]:
        logger.info("Starting web search — query=%r max_results=%r", query, max_results)
        yield_count = 0
        try:
            def search() -> Iterator[dict[str, Any]]:
                with DDGS() as ddgs:
                    raw_results = ddgs.text(query, max_results=max_results)
                    return raw_results

            raw_results = await asyncio.to_thread(search)

            for i, r in enumerate(raw_results):
                url = r.get("href")
                title = r.get("title", "")
                snippet = r.get("body", "")

                if not url or not url.strip():
                    logger.warning("Result[%d] skipped — missing or empty URL. Raw result: %r", i, r)
                    continue

                url = url.strip()
                result = SearchResult(url=url, title=title, snippet=snippet)
                logger.debug("Result[%d] accepted — url=%s, title=%r", i, url, title)
                yield_count+=1
                yield result

        except Exception as e:
            logger.error("Web search failed for query=%r: %s", query, e, exc_info=True)

        logger.info("Web search complete — %d valid results returned for query=%r", yield_count, query)
        return