from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig, DefaultMarkdownGenerator, HTTPCrawlerConfig
from crawl4ai.content_filter_strategy import PruningContentFilter
import httpx

class Crawl:
    def __init__(self, url: str, crawler: AsyncWebCrawler):
        self.url = url
        self.crawler = crawler
        self.browser_config = BrowserConfig(
            headless=True,
            text_mode=True,         # Blocks images entirely from downloading
            light_mode=True,        # Disables unneeded background browser features
            avoid_css=True,         # Skips downloading and parsing CSS stylesheets
            avoid_ads=True          # Blocks known ad and tracker network requests
        )


    async def crawl_config(self) -> CrawlerRunConfig:
        content_filter = PruningContentFilter(
            threshold=0.45,          
            min_word_threshold=30, 
        )
        md_generator = DefaultMarkdownGenerator(content_filter=content_filter)
        config = CrawlerRunConfig(
            excluded_tags=['nav', 'footer', 'header', 'aside', 'form'],
            css_selector="article, main, .story-body",
            cache_mode=CacheMode.BYPASS,
            markdown_generator=md_generator,
            exclude_all_images=True,
            remove_overlay_elements=True,
            wait_until="domcontentloaded",
            delay_before_return_html=0.0,
        )
        return config

    async def run(self) -> str:
        # A fully organic browser header configuration to instantly pass edge-network filters
        headers = {
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

        try:
            # 1. Fetch raw HTML using an optimized async HTTPX client (Bypasses all automation frameworks)
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                response = await client.get(self.url, headers=headers)
                response.raise_for_status()
                html_content = response.text

            # 2. Feed the raw HTML straight into Crawl4AI's parser using the raw: prefix
            # This skips the entire networking layer and goes straight to high-speed text slicing
            run_config = CrawlerRunConfig(
                markdown_generator=DefaultMarkdownGenerator(),
                css_selector="article, main, #main-content",
                excluded_tags=['nav', 'footer', 'header', 'aside', 'form', 'script', 'style'],
                cache_mode=CacheMode.BYPASS
            )

            result = await self.crawler.arun(
                url=f"raw:{html_content}",  # The magic prefix tells Crawl4AI it's a raw string
                config=run_config
            )

            if result.success:
                return result.markdown.raw_markdown

        except Exception as e:
            # Fallback block: If HTTPX drops or errors, fall back gracefully to standard crawl
            print(f"[FAST-PATH] Direct fetch failed ({e}), falling back to crawler framework...")
            
        # 3. Graceful fallback if direct extraction hits a snag
        run_config = CrawlerRunConfig(
            markdown_generator=DefaultMarkdownGenerator(),
            css_selector="article, main",
            cache_mode=CacheMode.BYPASS
        )
        result = await self.crawler.arun(url=self.url, config=run_config)
        return result.markdown.raw_markdown if result.success else f"Crawl failed: {result.error_message}"