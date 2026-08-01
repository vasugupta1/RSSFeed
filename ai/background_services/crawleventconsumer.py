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


class CrawlEvent(BaseModel):
    url: str = Field(
        description="Url to crawl"
    )

class ArticleAnalysisEvent(BaseModel):
    url: str
    title: str
    summary: List[str]
    keywords: List[str]
    country: str

class CrawlEventConsumer:
    def __init__(self, 
                crawl_event_messaging: MessagingService,
                crawl_result_event_messaging: MessagingService,
                crawl: Crawl,
                analyser: RSSAnalyserService,
                embedding: EmbeddingService,
                loop: AbstractEventLoop):
        self.crawl_event_messaging = crawl_event_messaging
        self.crawl_result_event_messaging = crawl_result_event_messaging
        self.crawl = crawl
        self.analyser = analyser
        self.loop = loop
        self.embedding_service = embedding
        self.search_service: SearchService = SearchService()

    def _to_article_analysis_event(self, source: ArticleAnalysis, url: str) -> ArticleAnalysisEvent:
        return ArticleAnalysisEvent(
            url=url,
            title=source.title,
            summary=source.summary,
            keywords=source.keywords,
            country=source.country,
        )

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

            for word in key_words:
                search_results = self.search_service.web_search(word)

                for result in search_results:
                    enrichment_content.append(await self.crawl.run(result.url))

            for content in enrichment_content:
                article_analysis: ArticleAnalysis = self.analyser.analyze_text(content)
                self.embedding_service.generate_and_save_embedding(content, self._keywords_metadata(article_analysis))
    
        except Exception as e:
            logger.error(f"FAILED during search enrichment: {type(e).__name__}: {e}", exc_info=True)

    async def _process_message(self, result: dict) -> None:
        try:
            logger.info("Processing crawl event: %s", result)
            event = CrawlEvent.model_validate(result)
            
            logger.info("Crawling url: %s", event.url)
            crawl_result : str = await self.crawl.run(event.url)
        
            logger.info("Analysing crawled content for: %s", event.url)
            article_analysis: ArticleAnalysis = self.analyser.analyze_text(crawl_result)

            logger.info("Saving Enrichement Content: %s", article_analysis.keywords)
            await self._save_enrichment_content(article_analysis.keywords)

            logger.info("Generating and saving embeddings for crawl request")
            self.embedding_service.generate_and_save_embedding(crawl_result, self._keywords_metadata(article_analysis))
            
            analysis_event = self._to_article_analysis_event(article_analysis, event.url)
            logger.info("Publishing analysis result for: %s", event.url)
            self.crawl_result_event_messaging.publish(analysis_event.model_dump())

            logger.info("Successfully processed crawl event for: %s", event.url)
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

            result_ok = self.crawl_result_event_messaging.can_connect()
            logger.info("[Worker Thread] crawl_result_event_messaging connected: %s", result_ok)

            if crawl_ok and result_ok:
                logger.info("[Worker Thread] Connection successful. Starting consumer loop...")
                self.crawl_event_messaging.comsume(callback=self._sync_callback)
            else:
                logger.error("[Worker Thread] CRITICAL: Could not connect to RabbitMQ.")
        except Exception as e:
            logger.error("[Worker Thread] Unexpected error in run_consumer: %s", e, exc_info=True)