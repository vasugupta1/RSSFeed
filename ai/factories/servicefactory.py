from fastapi import FastAPI
from config.appconfiguration import AppConfiguration
from crawl4ai import AsyncWebCrawler, BrowserConfig
from repository.graphservice import GraphService
from repository.embedding import EmbeddingService
from services.searchservice import SearchService
from handlers.getentitiesrelationship import GetEntitiesRelationshipHandler

class ServiceContainer:
    def __init__(self):
        self.async_crawler: AsyncWebCrawler | None = None
        self.embedding_service: EmbeddingService | None = None
        self.graph_service: GraphService | None = None
        self.search_service: SearchService | None = None
        self.get_entities_relationship_handler: GetEntitiesRelationshipHandler | None = None
       
    def attach_to_app(self, app: FastAPI):
        app.state.async_crawler = self.async_crawler
        app.state.embedding_service = self.embedding_service
        app.state.graph_service = self.graph_service
        app.state.search_service = self.search_service
        app.state.get_entities_relationship_handler = self.get_entities_relationship_handler

    async def cleanup(self):
        if self.async_crawler:
            await self.async_crawler.close()


class ServiceContainerBuilder:
    def __init__(self, config: AppConfiguration, ):
        self.config = config
        self._container = ServiceContainer()

    async def build_infrastructure(self) -> "ServiceContainerBuilder":
        browser_config = BrowserConfig(
            headless=True,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
        )
        crawler = AsyncWebCrawler(config=browser_config)
        await crawler.start()
        self._container.async_crawler = crawler

        self._container.graph_service = GraphService(self.config.NEO4J_URI, self.config.LLM_URI, self.config.LLM_MODEL)
        self._container.search_service = SearchService()
        self._container.embedding_service = EmbeddingService(
            model_uri= self.config.EMBEDDING_URI, 
            model_name= self.config.EMBEDDING_MODEL, 
            vector_store_connection_string= self.config.VECTOR_DATBASE_URI)
        return self

    def build_api_handler(self) -> "ServiceContainerBuilder":
        if not self._container.graph_service:
            raise RuntimeError(
                "graph service has not been configured correctly for api handlers"
            )
        self._container.get_entities_relationship_handler = GetEntitiesRelationshipHandler(
            graph_service= self._container.graph_service
        )
        return self


    def build(self) -> ServiceContainer:
        return self._container