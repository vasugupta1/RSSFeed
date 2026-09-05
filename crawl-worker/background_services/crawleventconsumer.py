from messaging.aiomessagingservice import AsyncMessagingService
import logging
from graphs.crawlurlgraph import CrawlEventGraph
from models.crawlevent import CrawlEvent

logger = logging.getLogger(__name__)

class CrawlEventConsumer:
    def __init__(self, 
                queue_name: str,
                messaging_uri: str,
                crawl_url_graph: CrawlEventGraph):
        self.queue_name = queue_name
        self.crawl_url_graph = crawl_url_graph
        self.messaging_uri = messaging_uri

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl event: %s", result)
            event = CrawlEvent.model_validate(result)
            logger.info("Starting Graph url: %s", event.url)
            graph = self.crawl_url_graph.build_crawl_graph()
            final_state = await graph.ainvoke({
                "url" : event.url,
                "attempt": 1,
                "max_attempt": 3
            })

            logger.info("Successfully processed crawl event for: %s with final state : %s", event.url, final_state)
        except Exception as e:
            logger.error("Failed to process crawl event: %s", e, exc_info=True)
            raise

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
