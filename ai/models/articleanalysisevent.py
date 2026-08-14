from pydantic import BaseModel, Field

class ArticleAnalysisEvent(BaseModel):
    url: str
    title: str
    summary: list[str]
    keywords: list[str]
    country: str