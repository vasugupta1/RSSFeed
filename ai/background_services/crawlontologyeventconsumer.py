import asyncio
import logging
from messaging.aiomessagingservice import AsyncMessagingService
from models.ontologyevent import OntologyEvent
from graphs.ontologygraph import OntologyGraph

logger = logging.getLogger(__name__)

class CrawlOntologyEventConsumer:
    def __init__(self,
                queue_name: str,
                messaging_uri: str,
                ontology_graph: OntologyGraph
                ):
        self.queue_name = queue_name
        self.messaging_uri = messaging_uri
        self.ontology_graph = ontology_graph

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl ontology event: %s", result)
            event = OntologyEvent.model_validate(result)

            logger.info("Starting Ontology Event Processing for: %s", event.title)

            graph = self.ontology_graph.build_graph()

            await graph.ainvoke({
                "keywords": event.keywords,
                "country": event.country,
                "title": event.title,
                "search_queries": event.search_queries,
            })

            logger.info("Successfully processed ontology event for: %s", event.title)
        except Exception as e:
            logger.error("Failed to process ontology crawl event: %s", e, exc_info=True)

    async def run_consumer(self):
        logger.info("[Worker Thread] Checking RabbitMQ connection for ontology...")
        try:
            async with AsyncMessagingService(self.messaging_uri) as messaging:
                await messaging.start_consumer(
                    queue_name=self.queue_name, 
                    callback=self._process_message, 
                    prefetch_count=1)
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in run_consumer for ontology: %s", e, exc_info=True)