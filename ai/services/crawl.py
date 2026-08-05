from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig, DefaultMarkdownGenerator, HTTPCrawlerConfig
from crawl4ai.content_filter_strategy import PruningContentFilter
import httpx
from typing import Tuple

class Crawl:
    
    __slots__ = ("url", "crawler", "browser_config", "headers")

    def __init__(self, crawler: AsyncWebCrawler):
        self.crawler = crawler
        self.browser_config = BrowserConfig(
            headless=True,
            text_mode=True,         # Blocks images entirely from downloading
            light_mode=True,        # Disables unneeded background browser features
            avoid_css=True,         # Skips downloading and parsing CSS stylesheets
            avoid_ads=True          # Blocks known ad and tracker network requests
        )
        self.headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1"
        }


    async def crawl_config(self) -> CrawlerRunConfig:
        md_generator = DefaultMarkdownGenerator()
        config = CrawlerRunConfig(
            excluded_tags=['nav', 'footer', 'header', 'aside', 'form'],
            css_selector="article, main, .story-body",
            cache_mode=CacheMode.BYPASS,
            markdown_generator=md_generator,
            exclude_all_images=True,
            remove_overlay_elements=True,
            wait_until="domcontentloaded",
            delay_before_return_html=2.0,
            magic=False,
            remove_consent_popups=True
        )
        return config
    

    async def fastCrawl(self, url: str) -> Tuple[bool, str]:
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                html_content = response.text

            run_config = CrawlerRunConfig(
                markdown_generator=DefaultMarkdownGenerator(),
                css_selector="article, main, #main-content",
                excluded_tags=['nav', 'footer', 'header', 'aside', 'form', 'script', 'style'],
                cache_mode=CacheMode.BYPASS,
                wait_for="css:article, main, .story-body"
            )

            result = await self.crawler.arun(
                url=f"raw:{html_content}", 
                config=run_config
            )

            if result.success and result.markdown and result.markdown.raw_markdown.strip():
                return  True, result.markdown.raw_markdown

        except Exception as e:
            print(f"[FAST-PATH] Direct fetch failed ({e}), falling back to crawler framework...")
        return False, ""
            
    async def slowCrawl(self, url:str) -> Tuple[bool, str]:
        try:
            run_config = await self.crawl_config()
            result = await self.crawler.arun(url=url, config=run_config)
            if result.success and result.markdown and result.markdown.raw_markdown.strip():
                return True, result.markdown.raw_markdown
        
        except Exception as e:
            print(f"[SLOW-PATH] Direct fetch failed ({e})")
        return False, ""

    async def run(self, url: str) -> str:
        success, result = await self.fastCrawl(url)
        if success:
            return result
        
        slowCrawlSuccess, slowCrawlResult = await self.slowCrawl(url)
        if slowCrawlSuccess:
            return slowCrawlResult
        raise Exception("Failed to crawl the url correctly")