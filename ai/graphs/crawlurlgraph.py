from typing import TypedDict
from langgraph.graph import StateGraph, END
from services.crawlpipeline import CrawlPipeline, ProcessedPage
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from logging import Logger
from repository.embedding import EmbeddingService
from messaging.messagingservice import MessagingService

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
    crawl_startergy:str
    failure_reason:str


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
    def make_publisher_node(messager: MessagingService):
        async def publisher_node(state: CrawlGraphState) -> dict:
            event = {
                "url": state.get("url"),
                "title": state.get("title"),
                "summary": state.get("summary"),
                "keywords": state.get("keywords"),
                "country": state.get("country"),
            }
            messager.publish_to_exchange(event)
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


class CrawlEventGraph:
    def __init__(
        self,
        crawl_pipeline: CrawlPipeline,
        analyser_service: RSSAnalyserService,
        embedding_service: EmbeddingService,
        messaging_service: MessagingService,
    ) -> None:
        self.crawl_pipeline = crawl_pipeline
        self.analyser_service = analyser_service
        self.embedding_service = embedding_service
        self.messaging_service = messaging_service

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


    def validate_analysis(self, state: CrawlGraphState) -> str:
        """After LLM analysis, check the output quality."""
        attempt = state.get("attempt", 1)
        max_attempt = state.get("max_attempt", 3)

        # Check: Did the LLM actually produce useful structured data?
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
            state["failure_reason"] = f"weak_analysis: {', '.join(problems)}"
            return "retry"

        return "embed"

    def build_crawl_graph(self):
        graph = StateGraph(CrawlGraphState)

        graph.add_node("crawl", CrawlEventNodes.make_crawl_node(self.crawl_pipeline))
        graph.add_node("analyze", CrawlEventNodes.make_analyise_node(self.analyser_service))
        graph.add_node("retry_crawl", CrawlEventNodes.retry_crawl_node)
        graph.add_node("embed", CrawlEventNodes.make_embed_node(self.embedding_service))
        graph.add_node("publish", CrawlEventNodes.make_publisher_node(self.messaging_service))
        graph.add_node("dead_letter", CrawlEventNodes.deadletter)
    
        graph.set_entry_point("crawl")

        graph.add_conditional_edges(
            "crawl",
            self.validate_crawl,
            {
                "analyze": "analyze",
                "retry": "retry_crawl",
                "dead_letter": "dead_letter",
            }
        )
            
        # Retry → back to crawl (the loop)
        graph.add_edge("retry_crawl", "crawl")

        # Analyze → validate → branch
        graph.add_conditional_edges(
            "analyze",
            self.validate_analysis,
            {
                "embed": "embed",
                "retry": "retry_crawl",
                "dead_letter": "dead_letter",
            }
        )
        
        # Happy path
        graph.add_edge("embed", "publish")
        graph.add_edge("publish", END)

        # Dead letter exits
        graph.add_edge("dead_letter", END)

        return graph.compile()