from typing import TypedDict
from services.crawlpipeline import CrawlPipeline, ProcessedPage
from services.searchservice import SearchService, SearchResult
from langgraph.graph import StateGraph, END
from repository.embedding import EmbeddingService
from messaging.aiomessagingservice import AsyncMessagingService
from services.researchanalysis import ResearchGeneratorService, ResearchGeneratorResult
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.analysisvalidator import AnalysisValidator, ValidationVerdict
from models.ontologyevent import OntologyEvent
import asyncio
import logging

logger = logging.getLogger(__name__)

class CrawlResearchState(TypedDict, total=False):
    """Input Event will tell us these 3 things"""
    keywords: list[str]
    country: str
    title: str
    summary: list[str]
    max_results:int

    """ Research should result in a list of string, for now only supporting html but in the future maybe pdf, youtube"""
    search_queries: list[str]
    search_results: list[SearchResult]
    enrichment_content: list[ProcessedPage]
    article_analysis : list[ArticleAnalysis]

    #validation — only analyses that pass both tiers
    validated_analyses: list[ArticleAnalysis]

class CrawlResearchNodes:

    @staticmethod
    def make_research_context_node(research_generator: ResearchGeneratorService):
        async def research_contex_node(state: CrawlResearchState) -> dict:
            
            result : ResearchGeneratorResult = await research_generator.generate_queries(
                summary= state["summary"],
                keywords= state["keywords"],
                country= state["country"],
                title= state["title"]
            )

            return {"search_queries": result.search_queries}

        return research_contex_node

    
    @staticmethod
    def make_search_node(search_service: SearchService):
        async def search_node(state: CrawlResearchState) -> dict:

            async def collect_search_results(query: str) -> list[SearchResult]:
                return [result async for result in search_service.web_search(query, max_results = state["max_results"])]

            search_results = await asyncio.gather(*[
                collect_search_results(query)
                for query in state["search_queries"]
            ])
        
            return {
                "search_results": [result 
                                   for query_results in search_results
                                   for result in query_results],
            }

        return search_node

    @staticmethod
    def make_crawl_node(crawl_pipeline: CrawlPipeline):
        async def crawl_node(state: CrawlResearchState) -> dict:

            async def safe_crawl(url: str) -> ProcessedPage | None:
                try:
                    return await crawl_pipeline.run(url)
                except Exception as e:
                    logger.warning("Crawl failed for %s: %s", url, e)
                    return None

            results = await asyncio.gather(
                *[
                    safe_crawl(search_result.url)
                    for search_result in state["search_results"]
                ]
            )

            enrichment_content = [page for page in results if page is not None]

            if not enrichment_content:
                logger.warning("All crawls failed — no enrichment content produced")

            return {
                   "enrichment_content": enrichment_content
                }
        return crawl_node


    @staticmethod
    def make_analyise_node(analysier: RSSAnalyserService):
        async def analyise_node(state: CrawlResearchState) -> dict:

            results = await asyncio.gather(
                *[
                    analysier.analyze_text_async(content.cleaned_markdown)
                    for content in state["enrichment_content"]
                ]
            )
            return {
                "article_analysis": results
            }
        return analyise_node
    

    @staticmethod
    def make_embed_node(embedder: EmbeddingService):
        async def embed_node(state: CrawlResearchState) -> dict:

            for content in state["validated_analyses"]:
                if not content.article_overview:
                    logger.warning("Skipping embed — empty article_overview")
                    continue
                metadata = {
                            "keywords" : content.keywords,
                            "bullet_point_summary" : content.bullet_point_summary,
                            "country": content.country
                        }
                embedder.generate_and_save_embedding(content.article_overview, metadata)
            return {}
        return embed_node

    @staticmethod
    def make_publisher_node(messaging_uri: str, queue_name:str):
        async def publisher_node(state: CrawlResearchState) -> dict:
            async with AsyncMessagingService(messaging_uri) as messaging:
                event = OntologyEvent(
                    keywords=state["keywords"],
                    country=state["country"],
                    title=state["title"],
                    search_queries=state.get("search_queries", []),
                )

                await messaging.publish(exchange_name= "", message_body= event.model_dump(), routing_key=queue_name)

            return {}

        return publisher_node


    @staticmethod
    def make_validate_node(validator: AnalysisValidator):
        """Two-tier validation across all article analyses in the batch.
        
        Tier 1: Cheap heuristic checks (empty fields, min lengths).
        Tier 2: LLM coherence/faithfulness check against source content.
        
        Invalid analyses are filtered out with a warning log.
        """
        async def validate_node(state: CrawlResearchState) -> dict:
            analyses: list[ArticleAnalysis] = state.get("article_analysis", [])
            enrichment: list[ProcessedPage] = state.get("enrichment_content", [])
            validated: list[ArticleAnalysis] = []

            for i, analysis in enumerate(analyses):
                source_md = enrichment[i].cleaned_markdown if i < len(enrichment) else ""
                # ── Tier 1: LLM coherence check ──
                try:
                    verdict: ValidationVerdict = await validator.validate(
                        source_markdown=source_md,
                        title=analysis.title,
                        summary=analysis.summary,
                        bullet_point_summary=analysis.bullet_point_summary,
                        keywords=analysis.keywords,
                        article_overview=analysis.article_overview,
                        country=analysis.country,
                    )

                    if verdict.is_valid:
                        validated.append(analysis)
                    else:
                        logger.warning(
                            "Research analysis %d/%d failed tier 2 LLM validation: "
                            "problem_type=%s, reasons=%s (title=%s)",
                            i + 1, len(analyses), verdict.problem_type, verdict.reasons, analysis.title
                        )
                except Exception as e:
                    logger.error(
                        "LLM validation failed for analysis %d/%d, passing through: %s",
                        i + 1, len(analyses), e
                    )
                    validated.append(analysis)

            logger.info(
                "Research validation complete: %d/%d analyses passed",
                len(validated), len(analyses)
            )

            return {"validated_analyses": validated}
        return validate_node


class CrawlResearchGraph:

    def __init__(self,
                research_generator: ResearchGeneratorService,
                search_service: SearchService,
                crawl_pipeline: CrawlPipeline,
                analyser: RSSAnalyserService,
                embedder: EmbeddingService,
                analysis_validator: AnalysisValidator,
                messaging_uri: str,
                crawl_onotlogy_queue_name:str) -> None:
            self.research_generator = research_generator
            self.search_service = search_service
            self.crawl_pipeline = crawl_pipeline
            self.analyser = analyser
            self.embedder = embedder
            self.analysis_validator = analysis_validator
            self.messaging_uri = messaging_uri
            self.crawl_onotlogy_queue_name = crawl_onotlogy_queue_name


    def build_graph(self):
        graph = StateGraph(CrawlResearchState)

        graph.add_node(
            "research_context",
            CrawlResearchNodes.make_research_context_node(
                self.research_generator
            ),
        )

        graph.add_node(
            "search",
            CrawlResearchNodes.make_search_node(
                self.search_service
            ),
        )

        graph.add_node(
            "crawl",
            CrawlResearchNodes.make_crawl_node(
                self.crawl_pipeline
            ),
        )

        graph.add_node(
            "analyse",
            CrawlResearchNodes.make_analyise_node(
                self.analyser
            ),
        )

        graph.add_node(
            "validate",
            CrawlResearchNodes.make_validate_node(
                self.analysis_validator
            ),
        )

        graph.add_node(
            "embed",
            CrawlResearchNodes.make_embed_node(
                self.embedder
            ),
        )

        graph.add_node(
            "publish",
            CrawlResearchNodes.make_publisher_node(
                    messaging_uri = self.messaging_uri, 
                    queue_name= self.crawl_onotlogy_queue_name))

        graph.set_entry_point("research_context")

        graph.add_edge("research_context", "search")
        graph.add_edge("search", "crawl")
        graph.add_edge("crawl", "analyse")
        graph.add_edge("analyse", "validate")
        graph.add_edge("validate", "embed")
        graph.add_edge("embed", "publish")
        graph.add_edge("publish", END)

        return graph.compile()