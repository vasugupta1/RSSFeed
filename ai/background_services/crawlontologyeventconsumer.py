import asyncio
import logging
from messaging.aiomessagingservice import AsyncMessagingService
from models.ontologyevent import OntologyEvent

logger = logging.getLogger(__name__)

class CrawlOntologyEventConsumer:
    def __init__(self,
                queue_name: str,
                messaging_uri: str
                ):
        self.queue_name = queue_name
        self.messaging_uri = messaging_uri
       

    async def _process_message(self, result: dict) -> None:
            try:
                logger.info("Processing crawl research event: %s", result)
                event = OntologyEvent.model_validate(result)
    
                logger.info("Starting Ontology Event Processing for: %s", event.title)
    
                # graph = self.crawl_research_graph.build_graph()
    
                # final_state = await graph.ainvoke({
                #     "keywords": event.keywords,
                #     "country": event.country,
                #     "title": event.title,
                #     "summary": event.summary,
                #     "max_results": 1,
                # })
    
                logger.info("Successfully processed ontology event")
            except Exception as e:
                logger.error("Failed to process research crawl event: %s", e, exc_info=True)
    

    async def run_consumer(self):
            logger.info("[Worker Thread] Checking RabbitMQ connection...")
            try:
                async with AsyncMessagingService(self.messaging_uri) as messaging:
                    await messaging.start_consumer(
                        queue_name=self.queue_name, 
                        callback=self._process_message, 
                        prefetch_count=1)
            except Exception as e:
                logger.error("[Worker Thread] Unexpected error in run_consumer: %s", e, exc_info=True)