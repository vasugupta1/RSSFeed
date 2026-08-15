from fastapi import FastAPI
from config.appconfiguration import AppConfiguration
from crawl4ai import AsyncWebCrawler, BrowserConfig
from services.articleanalysis import RSSAnalyserService
from services.articleontology import ArticleOntologyService
from repository.graphservice import GraphService
from messaging.messagingservice import MessagingService
from background_services.crawleventconsumer import CrawlEventConsumer
from repository.embedding import EmbeddingService
from services.searchservice import SearchService
from background_services.crawlresearcheventconsumer import CrawlResearchEventConsumer
from services.crawlpipeline import CrawlPipeline
from services.researchanalysis import ResearchGeneratorService
from graphs.crawlurlgraph import CrawlEventGraph
from graphs.researcheventgraph import CrawlResearchGraph
import asyncio

class ServiceContainer:
    """Holds all initialized service singletons."""
    def __init__(self):
        self.async_crawler: AsyncWebCrawler | None = None
        self.crawl_pipeline: CrawlPipeline | None = None
        self.rss_analyser_service: RSSAnalyserService | None = None
        self.embedding_service: EmbeddingService | None = None
        self.ontology_service: ArticleOntologyService | None = None
        self.graph_service: GraphService | None = None
        self.search_service: SearchService | None = None
        self.research_generator_service: ResearchGeneratorService | None = None
        self.crawl_event_messaging: MessagingService | None = None
        self.crawl_event_result_messaging: MessagingService | None = None
        self.crawl_event_consumer: CrawlEventConsumer | None = None
        self.crawl_research_event_messaging: MessagingService | None  = None
        self.crawl_research_event_consumer: CrawlResearchEventConsumer | None = None

    def attach_to_app(self, app: FastAPI):
        """Binds initialized services into app.state."""
        app.state.async_crawler = self.async_crawler
        app.state.crawl_pipeline = self.crawl_pipeline
        app.state.rss_analyser_service = self.rss_analyser_service
        app.state.embedding_service = self.embedding_service
        app.state.ontology_service = self.ontology_service
        app.state.graph_service = self.graph_service
        app.state.search_service = self.search_service
        app.state.crawl_event_messaging = self.crawl_event_messaging
        app.state.crawl_event_result_messaging = self.crawl_event_result_messaging
        app.state.crawl_event_consumer = self.crawl_event_consumer
        app.state.crawl_research_event_messaging = self.crawl_research_event_messaging
        app.state.crawl_research_event_consumer = self.crawl_research_event_consumer

    async def cleanup(self):
        """Gracefully close open resources on shutdown."""
        if self.async_crawler:
            await self.async_crawler.close()


class ServiceContainerBuilder:
    """Builder class responsible for constructing services step-by-step."""
    def __init__(self, config: AppConfiguration, ):
        self.config = config
        self._container = ServiceContainer()

    async def build_infrastructure(self) -> "ServiceContainerBuilder":
        """Step 1: Build low-level infrastructure and singletons."""
        browser_config = BrowserConfig(
            headless=True,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
        )
        crawler = AsyncWebCrawler(config=browser_config)
        await crawler.start()
        self._container.async_crawler = crawler

        self._container.graph_service = GraphService(self.config.DATABASE_URI)
        self._container.embedding_service = EmbeddingService(
            model_uri= self.config.EMBEDDING_URI, 
            model_name= self.config.EMBEDDING_MODEL, 
            vector_store_connection_string= self.config.VECTOR_DATBASE_URI)
        return self

    def build_messaging(self) -> "ServiceContainerBuilder":
        """Step 2: Initialize messaging services."""
        self._container.crawl_event_messaging = MessagingService(
            uri = self.config.MESSAGING_URI, 
            queue_name= self.config.CRAWL_QUEUE,
            exchange_name= None
        )
        self._container.crawl_event_result_messaging = MessagingService(
            uri = self.config.MESSAGING_URI, 
            queue_name= None,
            exchange_name= self.config.CRAWL_RESULT_EXCHANGE
        )

        self._container.crawl_research_event_messaging = MessagingService(
            uri = self.config.MESSAGING_URI, 
            queue_name= self.config.CRAWL_RESEARCH_EVENT_QUEUE,
            exchange_name= None
        )

        return self

    def build_domain_services(self) -> "ServiceContainerBuilder":
        """Step 3: Construct higher-level domain services with dependencies."""
        if not self._container.async_crawler or not self._container.graph_service or not self._container.embedding_service:
            raise RuntimeError("Infrastructure services must be built prior to domain services.")

        self._container.crawl_pipeline = CrawlPipeline(crawler=self._container.async_crawler)

        self._container.rss_analyser_service = RSSAnalyserService(
            url= self.config.LLM_URI, 
            model= self.config.LLM_MODEL)
        
        self._container.ontology_service = ArticleOntologyService(
            url=self.config.LLM_URI, 
            model=self.config.LLM_MODEL, 
            embedding= self._container.embedding_service
        )
        self._container.search_service = SearchService()
        self._container.research_generator_service = ResearchGeneratorService(
            url=self.config.LLM_URI,
            model=self.config.LLM_MODEL)
        return self

    def build_crawl_event_background_service(self, loop: asyncio.AbstractEventLoop) ->  "ServiceContainerBuilder":

        if not (self._container.crawl_event_messaging 
                and self._container.crawl_event_result_messaging 
                and self._container.crawl_pipeline 
                and self._container.rss_analyser_service 
                and self._container.embedding_service):
            raise RuntimeError(
                "Cannot build CrawlEventConsumer: Messaging, Crawler, RSS Analyser, "
                "and Embedding services must be initialized first."
            )

        crawl_url_graph = CrawlEventGraph(
            self._container.crawl_pipeline, 
            self._container.rss_analyser_service,
            self._container.embedding_service,
            self._container.crawl_event_result_messaging)
        
        self._container.crawl_event_consumer = CrawlEventConsumer(
            crawl_event_messaging = self._container.crawl_event_messaging,
            crawl_url_graph= crawl_url_graph,
            loop = loop
        )

        return self


    def build_crawl_research_event_background_service(self, loop: asyncio.AbstractEventLoop) -> "ServiceContainerBuilder":
        if not (self._container.crawl_research_event_messaging 
                and self._container.crawl_pipeline 
                and self._container.rss_analyser_service 
                and self._container.embedding_service
                and self._container.search_service
                and self._container.research_generator_service):
            raise RuntimeError(
                "Cannot build CrawlResearchEventConsumer: Messaging, CrawlPipeline, "
                "RSS Analyser, Embedding, Search, and ResearchGenerator services must be initialized first."
            )

        crawl_research_graph = CrawlResearchGraph(
            research_generator=self._container.research_generator_service,
            search_service=self._container.search_service,
            crawl_pipeline=self._container.crawl_pipeline,
            analyser=self._container.rss_analyser_service,
            embedder=self._container.embedding_service,
        )
                
        self._container.crawl_research_event_consumer = CrawlResearchEventConsumer(
            crawl_research_event_messaging=self._container.crawl_research_event_messaging,
            crawl_research_graph=crawl_research_graph,
            loop=loop,
        )

        return self


    def build(self) -> ServiceContainer:
        """Step 4: Returns the fully constructed container."""
        return self._container