
from services.articleontology import ArticleOntologyService
from repository.graphservice import GraphService
from repository.embedding import EmbeddingService
import logging
import asyncio
from asyncio import Future
from messaging.messagingservice import MessagingService
from pydantic import BaseModel, Field
from typing import List
from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from asyncio.events import AbstractEventLoop
from concurrent.futures import Future
from repository.embedding import EmbeddingService
from services.searchservice import SearchService
import asyncio
import logging

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

class OntologyEventConsumer:
    def __init__(self,onotology: ArticleOntologyService, graph: GraphService, embedding: EmbeddingService):
        self.onotlogy_service : ArticleOntologyService = onotology
        self.graph_service : GraphService = graph 
        self.embedding_service: EmbeddingService = embedding

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl event: %s", result)
           
            logger.info("Successfully processed crawl rsearch event for: %s", )
        except Exception as e:
            logger.error("Failed to process research crawl event: %s", e, exc_info=True)


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
            # crawl_ok = self.crawl_event_messaging.can_connect()
            # logger.info("[Worker Thread] crawl_event_messaging connected: %s", crawl_ok)

            # result_ok = self.crawl_result_event_messaging.can_connect()
            # logger.info("[Worker Thread] crawl_result_event_messaging connected: %s", result_ok)

            # if crawl_ok and result_ok:
            #     logger.info("[Worker Thread] Connection successful. Starting consumer loop...")
            #     self.crawl_event_messaging.comsume(callback=self._sync_callback)
            # else:
            #     logger.error("[Worker Thread] CRITICAL: Could not connect to RabbitMQ.")
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in run_consumer: %s", e, exc_info=True)



