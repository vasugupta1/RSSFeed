from config.appconfiguration import AppConfiguration
from crawl4ai import AsyncWebCrawler, BrowserConfig
from services.articleanalysis import RSSAnalyserService
from services.analysisvalidator import AnalysisValidator
from services.searchservice import SearchService
from services.researchanalysis import ResearchGeneratorService
from services.crawlpipeline import CrawlPipeline
from repository.embedding import EmbeddingService
from background_services.crawlresearcheventconsumer import CrawlResearchEventConsumer
from graphs.researcheventgraph import CrawlResearchGraph


class WorkerServiceContainer:
    """Holds all initialized service singletons for the research worker."""

    def __init__(self):
        self.async_crawler: AsyncWebCrawler | None = None
        self.crawl_research_event_consumer: CrawlResearchEventConsumer | None = None

    async def cleanup(self):
        """Gracefully close open resources on shutdown."""
        if self.async_crawler:
            await self.async_crawler.close()

    @staticmethod
    async def build(config: AppConfiguration) -> "WorkerServiceContainer":
        """Build all services required by the research worker."""
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

        research_generator = ResearchGeneratorService(
            url=config.LLM_URI,
            model=config.LLM_MODEL,
        )

        search_service = SearchService()

        embedding_service = EmbeddingService(
            model_uri=config.EMBEDDING_URI,
            model_name=config.EMBEDDING_MODEL,
            vector_store_connection_string=config.VECTOR_DATBASE_URI,
        )

        # Graph pipeline
        crawl_research_graph = CrawlResearchGraph(
            research_generator=research_generator,
            search_service=search_service,
            crawl_pipeline=crawl_pipeline,
            analyser=rss_analyser,
            embedder=embedding_service,
            analysis_validator=analysis_validator,
            messaging_uri=config.MESSAGING_URI,
            crawl_onotlogy_queue_name=config.ONTOLOOGY_QUEUE,
        )

        # Consumer
        container.crawl_research_event_consumer = CrawlResearchEventConsumer(
            queue_name=config.CRAWL_RESEARCH_EVENT_QUEUE,
            messaging_uri=config.MESSAGING_URI,
            crawl_research_graph=crawl_research_graph,
        )

        return container
