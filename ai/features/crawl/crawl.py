from crawl4ai import AsyncWebCrawler

class Crawl:
    def __init__(self, url: str):
        self.url = url

    async def run(self) -> str:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=self.url)
            if result.success:
                return result.markdown
            else:
                return f"Crawl failed: {result.error_message}"
