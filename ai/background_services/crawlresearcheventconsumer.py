from messaging.messagingservice import MessagingService
from typing import List
from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from asyncio.events import AbstractEventLoop
from concurrent.futures import Future
from repository.embedding import EmbeddingService
from services.searchservice import SearchService
import asyncio
import logging
from background_services.crawleventconsumer import ArticleAnalysisEvent

logger = logging.getLogger(__name__)

class CrawlResearchEventConsumer:
    def __init__(self, 
                crawl_research_event_messaging: MessagingService,
                crawl: Crawl,
                analyser: RSSAnalyserService,
                embedding: EmbeddingService,
                loop: AbstractEventLoop):
        self.crawl_research_event_messaging = crawl_research_event_messaging
        self.crawl = crawl
        self.analyser = analyser
        self.loop = loop
        self.embedding_service = embedding
        self.search_service: SearchService = SearchService()

    def _keywords_metadata(self, crawl_result: ArticleAnalysis ) -> dict[str, list[str]]:
        metadata = {
            "keywords" : crawl_result.keywords,
            "bullet_point_summary" : crawl_result.bullet_point_summary,
            "country": [crawl_result.country]
        }
        
        return metadata

    async def _save_enrichment_content(self, key_words: List[str]) :
        try:
            logger.info("Calling DuckDuckGo Search")

            enrichment_content = []

            query = ' '.join(key_words)
            logger.info("Calling DDG for: %s", query)
            async for search_result in self.search_service.web_search(query=query, max_results= 5):
                    enrichment_content.append(await self.crawl.run(search_result.url))

            for content in enrichment_content:
                article_analysis: ArticleAnalysis = self.analyser.analyze_text(content)
                self.embedding_service.generate_and_save_embedding(content, self._keywords_metadata(article_analysis))
    
        except Exception as e:
            logger.error(f"FAILED during search enrichment: {type(e).__name__}: {e}", exc_info=True)

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl event: %s", result)
            event = ArticleAnalysisEvent.model_validate(result)
            
            logger.info("Saving Enrichement Content: %s", event.keywords)
            await self._save_enrichment_content(event.keywords)
            
            logger.info("Successfully processed crawl rsearch event for: %s", event.url)
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