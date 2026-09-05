from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig, DefaultMarkdownGenerator, HTTPCrawlerConfig
from pydantic import BaseModel, HttpUrl
from typing import Optional
import trafilatura
import re

class CrawlRequest(BaseModel):
    url: HttpUrl
    headers: Optional[dict] = None

class ProcessedPage(BaseModel):
    url: str
    title: Optional[str] = None
    raw_html: str
    cleaned_markdown: str
    word_count: int

class WebCrawler:
    __slots__ = ("crawler", "browser_config", "headers", "config")
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
        self.config = CrawlerRunConfig(
            excluded_tags=['nav', 'footer', 'header', 'aside', 'form'],
            css_selector="article, main, .story-body",
            cache_mode=CacheMode.BYPASS,
            markdown_generator=DefaultMarkdownGenerator(),
            exclude_all_images=True,
            remove_overlay_elements=True,
            wait_until="domcontentloaded",
            delay_before_return_html=2.0,
            magic=False,
            remove_consent_popups=True
        )
        

    async def fetch(self, request: CrawlRequest) -> str:
        try:
            result = await self.crawler.arun(url=str(request.url), config=self.config)
            if result.success and result.html and result.html.strip():
                return result.html
        
        except Exception as e:
            print(f"[SLOW-PATH] Direct fetch failed ({e})")
        return ""
    

class ContentExtractor:
    def __init__(self):
        pass

    @staticmethod
    def extract_main_content(raw_html: str) -> str:
        """Uses Trafilatura for state-of-the-art main text & Markdown extraction."""
        extracted = trafilatura.extract(
            raw_html,
            output_format="markdown",
            include_links=True,
            include_images=False,
            include_formatting=True,
            no_fallback=False
        )
        return extracted or ""

    @staticmethod
    def sanitize_markdown(markdown_text: str) -> str:
        """Applies regex filters to clean residual noise, ads, and blank lines."""
        if not markdown_text:
            return ""

        # Remove repetitive social share widgets and boilerplate noise
        cleaned = re.sub(r'\[?(?:Share|Tweet|Pin|Email|Facebook|LinkedIn)\]?\(.*?\)', '', markdown_text, flags=re.IGNORECASE)
        # Remove navigation/menu leftovers (e.g. '| Home | About |')
        cleaned = re.sub(r'(\|[^\n]+\|[\r\n]+){2,}', '', cleaned)
        # Collapse 3+ consecutive line breaks into two
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        
        return cleaned.strip()

    def process(self, raw_html:str) -> str:
        extracted = self.extract_main_content(raw_html)
        cleaned = self.sanitize_markdown(extracted)
        return cleaned

class CrawlPipeline:
    def __init__(self, crawler: AsyncWebCrawler):
        self.crawler = WebCrawler(crawler= crawler)
        self.extractor = ContentExtractor()
        
    async def run(self, url:str) -> ProcessedPage:
        request = CrawlRequest(url= HttpUrl(url))
        raw_html = await self.crawler.fetch(request)

        if not raw_html:
            return ProcessedPage(url= str(url), raw_html="", cleaned_markdown="", word_count= 0)
    
        clean_md = self.extractor.process(raw_html)
        word_count = len(clean_md.split())
        return ProcessedPage(
            url= str(url),
            raw_html= raw_html,
            cleaned_markdown= clean_md,
            word_count=word_count
        )        
