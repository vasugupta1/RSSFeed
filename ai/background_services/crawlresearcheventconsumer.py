from messaging.aiomessagingservice import AsyncMessagingService
from asyncio.events import AbstractEventLoop
from graphs.researcheventgraph import CrawlResearchGraph
import logging
from models.articleanalysisevent import ArticleAnalysisEvent

logger = logging.getLogger(__name__)

class CrawlResearchEventConsumer:
    def __init__(self, 
                queue_name: str,
                crawl_research_event_messaging: AsyncMessagingService,
                crawl_research_graph: CrawlResearchGraph):
        self.crawl_research_event_messaging = crawl_research_event_messaging
        self.crawl_research_graph = crawl_research_graph
        self.queue_name = queue_name

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl research event: %s", result)
            event = ArticleAnalysisEvent.model_validate(result)
            logger.info("Starting CrawlResearchGraph for: %s", event.url)
            graph = self.crawl_research_graph.build_graph()
            await graph.ainvoke({
                "keywords": event.keywords,
                "country": event.country,
                "title": event.title,
                "summary": event.summary,
                "max_results": 1,
            })

            logger.info("Successfully processed crawl research event for: %s", event.url)
        except Exception as e:
            logger.error("Failed to process research crawl event: %s", e, exc_info=True)

    async def run_consumer(self):
        logger.info("[Worker Thread] Checking RabbitMQ connection...")
        try:
            await self.crawl_research_event_messaging.connect()
            await self.crawl_research_event_messaging.start_consumer(
                queue_name= self.queue_name,
                callback=self._process_message,
                prefetch_count=10
            )
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in research consumer: %s", e, exc_info=True)