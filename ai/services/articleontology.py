from pydantic import BaseModel, Field
from typing import List, cast
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_mcp_adapters.client import MultiServerMCPClient
from ai.services.searchservice import SearchMCP
import logging


logger = logging.getLogger(__name__)


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
    def __init__(self, url:str, model:str, mcp_server_url:str,  config:dict):
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
            ("human", "Extract the ontology from this article content: {message}, with context: {context}", )
        ])
        self.chain = self.prompt | self.structured_llm
        self.search_mcp: SearchMCP = SearchMCP(mcp_server_url= mcp_server_url, model= model, url= url)
    

    async def extract_ontology(self, text_content: str, key_words: List[str]) -> ArticleOntology:
        logger.info("=== ArticleOntologyService.extract_ontology START ===")
        logger.info(f"Text content length: {len(text_content)} chars")
        logger.info(f"Keywords: {key_words}")

        # Step 1: Enrich context via MCP search
        try:
            logger.info("Calling SearchMCP.extract_with_search...")
            enrich_context = await self.search_mcp.extract_with_search(key_words=key_words)
            logger.info(f"MCP search returned context: {len(enrich_context)} chars")
            logger.info(f"Context preview: {enrich_context[:500]}")
        except Exception as e:
            logger.error(f"FAILED during MCP search enrichment: {type(e).__name__}: {e}", exc_info=True)
            raise

        # Step 2: Run ontology extraction chain
        try:
            logger.info("Invoking ontology LLM chain...")
            response = self.chain.invoke({"message": text_content, "context": enrich_context})
            logger.info(f"Ontology chain response type: {type(response).__name__}")
            logger.info(f"Ontology result: {response}")
        except Exception as e:
            logger.error(f"FAILED during ontology chain invocation: {type(e).__name__}: {e}", exc_info=True)
            raise

        logger.info("=== ArticleOntologyService.extract_ontology END ===")
        return cast(ArticleOntology, response)