from messaging.messagingservice import MessagingService
from asyncio.events import AbstractEventLoop
from concurrent.futures import Future
from graphs.researcheventgraph import CrawlResearchGraph
import asyncio
import logging
from models.articleanalysisevent import ArticleAnalysisEvent

logger = logging.getLogger(__name__)

class CrawlResearchEventConsumer:
    def __init__(self, 
                crawl_research_event_messaging: MessagingService,
                crawl_research_graph: CrawlResearchGraph,
                loop: AbstractEventLoop):
        self.crawl_research_event_messaging = crawl_research_event_messaging
        self.crawl_research_graph = crawl_research_graph
        self.loop = loop

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl research event: %s", result)
            event = ArticleAnalysisEvent.model_validate(result)

            logger.info("Starting CrawlResearchGraph for: %s", event.url)

            graph = self.crawl_research_graph.build_graph()

            final_state = await graph.ainvoke({
                "keywords": event.keywords,
                "country": event.country,
                "title": event.title,
                "summary": event.summary,
                "max_results": 5,
            })

            logger.info("Successfully processed crawl research event for: %s with final state: %s", event.url, final_state)
        except Exception as e:
            logger.error("Failed to process research crawl event: %s", e, exc_info=True)

    def _sync_callback(self, result: dict) -> None:
        """Bridge: schedules the async work on the main event loop and blocks until it completes."""
        try:
            future: Future = asyncio.run_coroutine_threadsafe(self._process_message(result), self.loop)
            future.result()
        except TimeoutError:
            logger.error("Processing timed out after 300 for message: %s", result)
            raise
        except Exception as e:
            logger.error("Error in sync callback bridge: %s", e, exc_info=True)

    def run_consumer(self):
        logger.info("[Worker Thread] Checking RabbitMQ connection...")
        try:
            if self.crawl_research_event_messaging.can_connect():
                logger.info("[Worker Thread] Crawl Research Event Connection successful. Starting consumer loop...")
                self.crawl_research_event_messaging.comsume(callback=self._sync_callback)
            else:
                logger.error("[Worker Thread] CRITICAL: Could not connect crawl research event queue to RabbitMQ.")
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in research consumer: %s", e, exc_info=True)