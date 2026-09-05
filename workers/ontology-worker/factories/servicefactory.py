from config.appconfiguration import AppConfiguration
from repository.graphservice import GraphService
from repository.embedding import EmbeddingService
from background_services.crawlontologyeventconsumer import CrawlOntologyEventConsumer
from graphs.ontologygraph import OntologyGraph


class WorkerServiceContainer:
    """Holds all initialized service singletons for the ontology worker."""

    def __init__(self):
        self.graph_service: GraphService | None = None
        self.embedding_service: EmbeddingService | None = None
        self.crawl_ontology_event_consumer: CrawlOntologyEventConsumer | None = None

    async def cleanup(self):
        """Gracefully close open resources on shutdown."""
        pass

    @staticmethod
    async def build(config: AppConfiguration) -> "WorkerServiceContainer":
        """Build all services required by the ontology worker."""
        container = WorkerServiceContainer()

        container.graph_service = GraphService(
            graph_uri=config.NEO4J_URI,
            llm_url=config.LLM_URI,
            model=config.LLM_MODEL,
        )

        container.embedding_service = EmbeddingService(
            model_uri=config.EMBEDDING_URI,
            model_name=config.EMBEDDING_MODEL,
            vector_store_connection_string=config.VECTOR_DATBASE_URI,
        )

        ontology_graph = OntologyGraph(
            embedding_service=container.embedding_service,
            graph_service=container.graph_service,
        )

        container.crawl_ontology_event_consumer = CrawlOntologyEventConsumer(
            queue_name=config.ONTOLOOGY_QUEUE,
            messaging_uri=config.MESSAGING_URI,
            ontology_graph=ontology_graph,
        )

        return container
