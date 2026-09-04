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

class Entity(BaseModel):
    id: str
    name: str
    type: str

class Relationship(BaseModel):
    source: str
    target: str
    type: str

class GetEntitiesRelationshipResponse(BaseModel):
    nodes: list[Entity]
    edges: list[Relationship]

class GetEntitiesRelationshipHandler:
    def __init__(self, graph_service: GraphService) -> None:
        self.graph_service = graph_service

    async def handle(self, query: GetEntitiesRelationshipQuery, response: Response) -> GetEntitiesRelationshipResponse:
        results = self.graph_service.query_by_keyword(query.keyword)
        
        nodes_map = {}
        edges = []

        for record in results:
            source_id = record.get("source_name")
            target_id = record.get("target_name")
            
            if source_id and source_id not in nodes_map:
                nodes_map[source_id] = Entity(
                    id=source_id,
                    name=source_id,
                    type=record.get("source_type", "Entity")
                )
                
            if target_id and target_id not in nodes_map:
                nodes_map[target_id] = Entity(
                    id=target_id,
                    name=target_id,
                    type=record.get("target_type", "Entity")
                )
                
            if source_id and target_id:
                edges.append(Relationship(
                    source=source_id,
                    target=target_id,
                    type=record.get("relationship", "RELATED_TO")
                ))

        response.status_code = status.HTTP_200_OK
        return GetEntitiesRelationshipResponse(
            nodes=list(nodes_map.values()),
            edges=edges
        )