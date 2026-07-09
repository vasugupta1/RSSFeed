from pydantic import BaseModel, Field
from typing import List, cast
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

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


class ArticleOntologyService:
    def __init__(self, url:str, model:str, config:dict):
        self.llm = ChatOllama(model=model, base_url=url, temperature=0.0)
        self.structured_llm = self.llm.with_structured_output(
            ArticleOntology,
            method="json_schema"
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert knowledge graph and ontology engineer. "
                "Analyze the provided text and extract a strict ontology consisting of entities and their relationships. "
                "Ensure entity names are standardized (e.g., use 'Microsoft' instead of 'MSFT' if applicable). "
                "Every relationship source and target MUST match a name defined in the entities list."
            )),
            ("human", "Extract the ontology from this article content: {message}")
        ])
        self.chain = self.prompt | self.structured_llm

    def extract_ontology(self, text_content: str) -> ArticleOntology:
        response = self.chain.invoke({"message": text_content})
        return cast(ArticleOntology, response)