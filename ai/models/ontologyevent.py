from pydantic import BaseModel
from services.crawlpipeline import ProcessedPage
from services.searchservice import SearchResult
from services.articleanalysis import ArticleAnalysis

class OntologyEvent(BaseModel):
    keywords: list[str]
    country: str
    title: str
    search_queries: list[str]