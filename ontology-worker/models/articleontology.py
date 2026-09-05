from pydantic import BaseModel, Field
from typing import List


class Entity(BaseModel):
    name: str = Field(description="The canonical name of the entity (e.g., 'Google', 'Artificial Intelligence', 'Sundar Pichai').")
    type: str = Field(description="The category of the entity (e.g., 'Organization', 'Technology', 'Person', 'Concept').")

class Relationship(BaseModel):
    source: str = Field(description="The name of the source entity.")
    target: str = Field(description="The name of the target entity.")
    relation_type: str = Field(description="The relationship between source and target, written as a verb or predicate (e.g., 'DEVELOPED', 'EMPLOYED_BY', 'IS_A_SUBFIELD_OF').")


class ArticleOntology(BaseModel):
    entities: List[Entity] = Field(description="List of all unique entities found in the article.")
    relationships: List[Relationship] = Field(description="List of all directed relationships connecting the entities.")
