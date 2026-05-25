from crawl4ai import AsyncWebCrawler
import httpx
from playwright.async_api import async_playwright


class Crawl:
    def __init__(self, url: str):
        self.url = url

    async def run(self) -> str:
        async with AsyncWebCrawler() as crawler:
            final_url = await self._get_real_url()

            result = await crawler.arun(url=final_url)

            if result.success:
                return result.markdown
            return f"Crawl failed: {result.error_message}"

    async def _get_real_url(self) -> str:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://news.google.com/",
        }

        async with httpx.AsyncClient(follow_redirects=True, headers=headers, timeout=10) as client:
            resp = await client.get(self.url)
            return str(resp.url)
        # async with async_playwright() as p:
        #     browser = await p.chromium.launch(headless=True)
        #     page = await browser.new_page()
        #     await page.goto(self.url, wait_until="networkidle")
        #     print(f"Final URL after redirects: {page.url}")
        #     await browser.close()
        #     return page.url