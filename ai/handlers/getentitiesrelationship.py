from pydantic import BaseModel, Field, field_validator
from typing import Annotated
from repository.graphservice import GraphService
from fastapi import status, Response

class GetEntitiesRelationshipQuery(BaseModel):
    keyword: Annotated[str, Field(min_length= 1, max_length= 100)]

    @field_validator("keyword")
    @classmethod
    def validate_keyword_not_whitespace(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("keyword cannot be empty or whitespace")
        return trimmed

class GetEntitiesRelationshipResponse(BaseModel):
    entities: str

class GetEntitiesRelationshipHandler:
    def __init__(self, graph_service: GraphService) -> None:
        self.graph_service = graph_service

    async def handle(self, query: GetEntitiesRelationshipQuery, response: Response) -> GetEntitiesRelationshipResponse:
        response.status_code = 200
        return GetEntitiesRelationshipResponse(entities= query.keyword)