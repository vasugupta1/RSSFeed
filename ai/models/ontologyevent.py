from pydantic import BaseModel
from services.crawlpipeline import ProcessedPage
from services.searchservice import SearchResult
from services.articleanalysis import ArticleAnalysis

class OntologyEvent(BaseModel):
    keywords: list[str]
    country: str
    title: str
    summary: list[str]
    max_results:int
    search_queries: list[str]