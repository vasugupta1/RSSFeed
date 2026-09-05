from pydantic import BaseModel, Field

class CrawlEvent(BaseModel):
    url: str = Field(
        description="Url to crawl"
    )
