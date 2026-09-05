from pydantic import BaseModel

class OntologyEvent(BaseModel):
    keywords: list[str]
    country: str
    title: str
    search_queries: list[str]
