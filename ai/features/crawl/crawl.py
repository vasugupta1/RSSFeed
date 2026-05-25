from crawl4ai import AsyncWebCrawler

class Crawl:
    def __init__(self, url: str, crawler: AsyncWebCrawler):
        self.url = url
        self.crawler = crawler

    async def run(self) -> str:
        result = await self.crawler.arun(url=self.url)
        if result.success:
                return result.markdown
        return f"Crawl failed: {result.error_message}"