from typing import TypedDict
from langgraph.graph import StateGraph, END
from services.crawlpipeline import CrawlPipeline, ProcessedPage
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.analysisvalidator import AnalysisValidator, ValidationVerdict
from logging import Logger
from repository.embedding import EmbeddingService
from messaging.aiomessagingservice import AsyncMessagingService

class CrawlGraphState(TypedDict, total= False):
    #input
    url:str
    raw_html:str
    cleaned_markdown:str
    word_count:int

    #crawl_result
    title:str
    summary: list[str]
    bullet_point_summary: list[str]
    keywords: list[str]
    article_overview: str
    country: str

    #retry
    attempt:int
    max_attempt:int
    crawl_strategy:str
    failure_reason:str

    #tier 2 validation
    validation_passed: bool
    validation_problem_type: str | None
    validation_reasons: list[str]


class CrawlEventNodes:

    @staticmethod
    def make_crawl_node(crawl_pipeline: CrawlPipeline):
        async def crawl_node(state: CrawlGraphState) -> dict:
            processed_page: ProcessedPage = await crawl_pipeline.run(state["url"])
            return {
                    "raw_html": processed_page.raw_html, 
                    "cleaned_markdown": processed_page.cleaned_markdown,
                    "word_count": processed_page.word_count 
                }
        return crawl_node

    @staticmethod
    def make_analyise_node(analysier: RSSAnalyserService):
        async def analyise_node(state: CrawlGraphState) -> dict:
            analysis: ArticleAnalysis = analysier.analyze_text(state["cleaned_markdown"])
            return {
                "title": analysis.title,
                "summary": analysis.summary,
                "bullet_point_summary": analysis.bullet_point_summary,
                "keywords": analysis.keywords,
                "article_overview": analysis.article_overview,
                "country": analysis.country
            }
        return analyise_node

    @staticmethod
    def make_embed_node(embedder: EmbeddingService):
        async def embed_node(state: CrawlGraphState) -> dict:
            metadata = {
                        "keywords" : state["keywords"],
                        "bullet_point_summary" : state["bullet_point_summary"],
                        "country": state['country']
                    }
            embedder.generate_and_save_embedding(state['cleaned_markdown'], metadata)
            return {}
        return embed_node


    @staticmethod
    def make_publisher_node(messager: AsyncMessagingService, exchange_name:str):
        async def publisher_node(state: CrawlGraphState) -> dict:
            event = {
                "url": state.get("url"),
                "title": state.get("title"),
                "summary": state.get("summary"),
                "keywords": state.get("keywords"),
                "country": state.get("country"),
            }
            await messager.connect()
            await messager.publish(exchange_name= exchange_name, message_body=event, routing_key="")
            return {}
        return publisher_node

    @staticmethod
    def retry_crawl_node(state: CrawlGraphState) -> dict:
        """Increment attempt counter and escalate strategy."""
        attempt = state.get("attempt", 1) + 1
        strategies = ["default", "relaxed", "aggressive"]
        # Escalate: attempt 2 → relaxed, attempt 3 → aggressive
        strategy = strategies[min(attempt - 1, len(strategies) - 1)]
        return {
            "attempt": attempt,
            "crawl_strategy": strategy,
        }

    """For now nothing will happen if we consider an event in deadletter, later on this will be used to put the message on to a queue"""
    @staticmethod
    def deadletter(state: CrawlGraphState) -> dict:
        return{}

    @staticmethod
    def make_llm_validation_node(validator: AnalysisValidator):
        """Tier 2: LLM-based coherence and faithfulness check."""
        async def llm_validate_node(state: CrawlGraphState) -> dict:
            verdict: ValidationVerdict = await validator.validate(
                source_markdown=state["cleaned_markdown"],
                title=state.get("title", ""),
                summary=state.get("summary", []),
                bullet_point_summary=state.get("bullet_point_summary", []),
                keywords=state.get("keywords", []),
                article_overview=state.get("article_overview", ""),
                country=state.get("country", ""),
            )
            return {
                "validation_passed": verdict.is_valid,
                "validation_problem_type": verdict.problem_type,
                "validation_reasons": verdict.reasons,
            }
        return llm_validate_node

    @staticmethod
    def retry_analyse_node(state: CrawlGraphState) -> dict:
        """Lightweight retry that skips re-crawling — just increments attempt and re-runs analysis."""
        return {"attempt": state.get("attempt", 1) + 1}


class CrawlEventGraph:
    def __init__(
        self,
        crawl_pipeline: CrawlPipeline,
        analyser_service: RSSAnalyserService,
        embedding_service: EmbeddingService,
        crawl_result_exchange_name:str,
        crawl_result_event_messaging: AsyncMessagingService,
        analysis_validator: AnalysisValidator,
    ) -> None:
        self.crawl_pipeline = crawl_pipeline
        self.analyser_service = analyser_service
        self.embedding_service = embedding_service
        self.crawl_result_exchange_name = crawl_result_exchange_name
        self.crawl_result_event_messaging = crawl_result_event_messaging
        self.analysis_validator = analysis_validator

    def validate_crawl(self, state: CrawlGraphState) -> str:
        attempt = state.get("attempt", 1)
        max_attempt = state.get("max_attempt", 3)

        if not state.get("cleaned_markdown") or not state["cleaned_markdown"].strip():
            if attempt >= max_attempt:
                return "dead_letter"
            state["failure_reason"] = "empty_markdown"
            return "retry"

        if state.get("word_count") < 50:
            if attempt >= max_attempt:
                return "dead_letter"
            state["failure_reason"] = f"too short summary with word count {state["word_count"]}"
            return "retry"

        return "analyze"


    def tier1_check(self, state: CrawlGraphState) -> str:
        """Tier 1: Cheap heuristic checks for structurally broken analysis output."""
        attempt = state.get("attempt", 1)
        max_attempt = state.get("max_attempt", 3)

        problems = []
        if not state.get("title") or state["title"].lower() in ("summary", "untitled", "n/a"):
            problems.append("bad_title")
        if not state.get("keywords") or len(state["keywords"]) == 0:
            problems.append("no_keywords")
        if not state.get("summary") or len(state["summary"]) == 0:
            problems.append("no_summary")
        if not state.get("article_overview") or len(state["article_overview"]) < 50:
            problems.append("thin_overview")

        if problems:
            if attempt >= max_attempt:
                return "dead_letter"
            return "retry"

        return "llm_validate"


    def tier2_route(self, state: CrawlGraphState) -> str:
        """Tier 2: Route based on LLM validation verdict — smart retry."""
        attempt = state.get("attempt", 1)
        max_attempt = state.get("max_attempt", 3)

        if state.get("validation_passed"):
            return "embed"

        if attempt >= max_attempt:
            return "dead_letter"

        problem = state.get("validation_problem_type")
        if problem == "content_issue":
            return "retry_crawl"
        else:
            return "retry_analyse"

    def build_crawl_graph(self):
        graph = StateGraph(CrawlGraphState)

        graph.add_node("crawl", CrawlEventNodes.make_crawl_node(self.crawl_pipeline))
        graph.add_node("analyze", CrawlEventNodes.make_analyise_node(self.analyser_service))
        graph.add_node("llm_validate", CrawlEventNodes.make_llm_validation_node(self.analysis_validator))
        graph.add_node("retry_crawl", CrawlEventNodes.retry_crawl_node)
        graph.add_node("retry_analyse", CrawlEventNodes.retry_analyse_node)
        graph.add_node("embed", CrawlEventNodes.make_embed_node(self.embedding_service))
        graph.add_node("publish", CrawlEventNodes.make_publisher_node(messager=self.crawl_result_event_messaging, exchange_name=self.crawl_result_exchange_name))
        graph.add_node("dead_letter", CrawlEventNodes.deadletter)
    
        graph.set_entry_point("crawl")

        # Crawl → validate crawl output
        graph.add_conditional_edges(
            "crawl",
            self.validate_crawl,
            {
                "analyze": "analyze",
                "retry": "retry_crawl",
                "dead_letter": "dead_letter",
            }
        )

        # Analyze → Tier 1 heuristic check
        graph.add_conditional_edges(
            "analyze",
            self.tier1_check,
            {
                "llm_validate": "llm_validate",
                "retry": "retry_crawl",
                "dead_letter": "dead_letter",
            }
        )

        # LLM validate → Tier 2 smart route
        graph.add_conditional_edges(
            "llm_validate",
            self.tier2_route,
            {
                "embed": "embed",
                "retry_crawl": "retry_crawl",
                "retry_analyse": "retry_analyse",
                "dead_letter": "dead_letter",
            }
        )

        # Retry loops
        graph.add_edge("retry_crawl", "crawl")
        graph.add_edge("retry_analyse", "analyze")

        # Happy path
        graph.add_edge("embed", "publish")
        graph.add_edge("publish", END)

        # Dead letter exits
        graph.add_edge("dead_letter", END)

        return graph.compile()