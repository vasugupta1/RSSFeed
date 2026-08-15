from typing import TypedDict
from services.crawlpipeline import CrawlPipeline, ProcessedPage
from services.searchservice import SearchService, SearchResult
from langgraph.graph import StateGraph, END
from repository.embedding import EmbeddingService
from messaging.messagingservice import MessagingService
from services.researchanalysis import ResearchGeneratorService, ResearchGeneratorResult
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
import asyncio

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


""" What do we want ?
    Basic Overview: 
    We want first to get the llm to understand what he needs for research -> call llm
    Take the response from llm and pass that over to duckduckgo api to search -> call search
    Take the search response and crawl -> call crawlPipeline
    Take all of the enrichement content and embed and save -> call embedding service
    Generate an event and publish for ontology -> call publishing service


    Feature List:
    1. llm and search need to work together with retry in order for it to understand that what search returned is good for enrichement
"""

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
            enrichment_content = await asyncio.gather(
                *[
                    crawl_pipeline.run(search_result.url)
                    for search_result in state["search_results"]
                ]
            )

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

            for content in state["article_analysis"]:
                metadata = {
                            "keywords" : content.keywords,
                            "bullet_point_summary" : content.bullet_point_summary,
                            "country": content.country
                        }
                embedder.generate_and_save_embedding(content.article_overview, metadata)
            return {}
        return embed_node


class CrawlResearchGraph:

    def __init__(self,
                research_generator: ResearchGeneratorService,
                search_service: SearchService,
                crawl_pipeline: CrawlPipeline,
                analyser: RSSAnalyserService,
                embedder: EmbeddingService,) -> None:
            self.research_generator = research_generator
            self.search_service = search_service
            self.crawl_pipeline = crawl_pipeline
            self.analyser = analyser
            self.embedder = embedder


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
            "embed",
            CrawlResearchNodes.make_embed_node(
                self.embedder
            ),
        )

        graph.set_entry_point("research_context")

        graph.add_edge("research_context", "search")
        graph.add_edge("search", "crawl")
        graph.add_edge("crawl", "analyse")
        graph.add_edge("analyse", "embed")
        graph.add_edge("embed", END)

        return graph.compile()

         


         
            