from typing import Any, Dict
from langchain_neo4j import Neo4jGraph
from langchain_ollama import ChatOllama
from langchain_neo4j import LLMGraphTransformer
from langchain_core.documents import Document
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)
class GraphService:
    def __init__(self, graph_uri: str, llm_url:str, model:str):
        parsed = urlparse(graph_uri)
        clean_url = f"{parsed.scheme}://{parsed.hostname}"
        if parsed.port:
            clean_url += f":{parsed.port}"
        self.graph = Neo4jGraph(
            url = clean_url,
            username= parsed.username,
            password=parsed.password,
            database="neo4j"
        )
        try:
            self.graph.query(
                "CREATE FULLTEXT INDEX entityIndex IF NOT EXISTS FOR (e:__Entity__) ON EACH [e.id]"
            )
        except Exception as e:
            logger.error(f"Failed to create fulltext index 'entityIndex': {e}")
            
        self.graph_transfomer = LLMGraphTransformer(llm = ChatOllama(
            model = model,
            base_url= llm_url,
            temperature= 0.0
        ))

    def insert_to_graph_doc(self, doc: Document) -> None:
        graph_docs = self.graph_transfomer.convert_to_graph_documents([doc])
        logger.info("[GraphService] graph_docs created: %s", graph_docs)
        self.graph.add_graph_documents(
            graph_docs,
            baseEntityLabel=True, 
            include_source=False)
