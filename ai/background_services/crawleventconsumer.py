from messaging.messagingservice import MessagingService
from asyncio.events import AbstractEventLoop
from concurrent.futures import Future
import asyncio
import logging
from graphs.crawlUrlGraph import CrawlEventGraph
from models.crawlevent import CrawlEvent

logger = logging.getLogger(__name__)

class CrawlEventConsumer:

    def __init__(self, 
                crawl_event_messaging: MessagingService,
                crawl_url_graph: CrawlEventGraph,
                loop: AbstractEventLoop):
        self.crawl_url_graph = crawl_url_graph
        self.crawl_event_messaging = crawl_event_messaging
        self.loop = loop

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

    def _sync_callback(self, result: dict) -> None:
        """Bridge: schedules the async work on the main event loop and blocks until it completes."""
        try:
            future: Future = asyncio.run_coroutine_threadsafe(self._process_message(result), self.loop)
            future.result(timeout=300)
        except TimeoutError:
            logger.error("Processing timed out after 300 for message: %s", result)
            raise
        except Exception as e:
            logger.error("Error in sync callback bridge: %s", e, exc_info=True)
            raise


    def run_consumer(self):
        logger.info("[Worker Thread] Checking RabbitMQ connection...")
        try:
            crawl_ok = self.crawl_event_messaging.can_connect()
            logger.info("[Worker Thread] crawl_event_messaging connected: %s", crawl_ok)

            if crawl_ok:
                logger.info("[Worker Thread] Connection successful. Starting consumer loop...")
                self.crawl_event_messaging.comsume(callback=self._sync_callback)
            else:
                logger.error("[Worker Thread] CRITICAL: Could not connect to RabbitMQ.")
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in run_consumer: %s", e, exc_info=True)