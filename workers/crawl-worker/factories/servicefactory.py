from config.appconfiguration import AppConfiguration
from crawl4ai import AsyncWebCrawler, BrowserConfig
from services.articleanalysis import RSSAnalyserService
from services.analysisvalidator import AnalysisValidator
from services.crawlpipeline import CrawlPipeline
from repository.embedding import EmbeddingService
from background_services.crawleventconsumer import CrawlEventConsumer
from graphs.crawlurlgraph import CrawlEventGraph


class WorkerServiceContainer:
    """Holds all initialized service singletons for the crawl worker."""

    def __init__(self):
        self.async_crawler: AsyncWebCrawler | None = None
        self.crawl_event_consumer: CrawlEventConsumer | None = None

    async def cleanup(self):
        """Gracefully close open resources on shutdown."""
        if self.async_crawler:
            await self.async_crawler.close()

    @staticmethod
    async def build(config: AppConfiguration) -> "WorkerServiceContainer":
        """Build all services required by the crawl worker."""
        container = WorkerServiceContainer()

        # Infrastructure: headless browser for crawling
        browser_config = BrowserConfig(
            headless=True,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
        )
        crawler = AsyncWebCrawler(config=browser_config)
        await crawler.start()
        container.async_crawler = crawler

        # Domain services
        crawl_pipeline = CrawlPipeline(crawler=crawler)

        rss_analyser = RSSAnalyserService(
            url=config.LLM_URI,
            model=config.LLM_MODEL,
        )

        analysis_validator = AnalysisValidator(
            url=config.LLM_URI,
            model=config.LLM_MODEL,
        )

        embedding_service = EmbeddingService(
            model_uri=config.EMBEDDING_URI,
            model_name=config.EMBEDDING_MODEL,
            vector_store_connection_string=config.VECTOR_DATBASE_URI,
        )

        # Graph pipeline
        crawl_event_graph = CrawlEventGraph(
            crawl_pipeline=crawl_pipeline,
            analyser_service=rss_analyser,
            embedding_service=embedding_service,
            crawl_result_exchange_name=config.CRAWL_RESULT_EXCHANGE,
            messaging_uri=config.MESSAGING_URI,
            analysis_validator=analysis_validator,
        )

        # Consumer
        container.crawl_event_consumer = CrawlEventConsumer(
            queue_name=config.CRAWL_QUEUE,
            messaging_uri=config.MESSAGING_URI,
            crawl_url_graph=crawl_event_graph,
        )

        return container
