from messaging.aiomessagingservice import AsyncMessagingService
from asyncio.events import AbstractEventLoop
from graphs.researcheventgraph import CrawlResearchGraph
import logging
import time
from opentelemetry import metrics
from models.articleanalysisevent import ArticleAnalysisEvent

logger = logging.getLogger(__name__)

class CrawlResearchEventConsumer:
    def __init__(self, 
                queue_name: str,
                messaging_uri: str,
                crawl_research_graph: CrawlResearchGraph):
        self.messaging_uri = messaging_uri
        self.crawl_research_graph = crawl_research_graph
        self.queue_name = queue_name

        # Initialize Metrics
        meter = metrics.get_meter("rssfeed.researchworker")
        self.research_processed_counter = meter.create_counter(
            "research.events.processed",
            description="Total number of research events successfully processed"
        )
        self.research_failed_counter = meter.create_counter(
            "research.events.failed",
            description="Total number of research events failed"
        )
        self.research_duration = meter.create_histogram(
            "research.duration",
            description="Time taken to process a research event",
            unit="s"
        )

    async def _process_message(self, result: dict) -> None:
        start_time = time.time()
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

            duration = time.time() - start_time
            self.research_duration.record(duration)
            self.research_processed_counter.add(1)
            logger.info("Successfully processed crawl research event for: %s", event.url)
        except Exception as e:
            self.research_failed_counter.add(1)
            logger.error("Failed to process research crawl event: %s", e, exc_info=True)

    async def run_consumer(self):
        logger.info("[Worker Thread] Checking RabbitMQ connection...")
        try:
            async with AsyncMessagingService(self.messaging_uri) as messaging:
                await messaging.start_consumer(
                    queue_name= self.queue_name,
                    callback=self._process_message,
                    prefetch_count=1
                )
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in research consumer: %s", e, exc_info=True)
