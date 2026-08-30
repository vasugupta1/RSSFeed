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
        logger.info(f"[GraphService] graph_docs created", graph_docs)
        self.graph.add_graph_documents(
            graph_docs,
            baseEntityLabel=True, 
            include_source=True)

    def query_by_keyword(self, keyword: str) -> list[Dict[str, Any]]:
        cypher_query = """
        MATCH (source)
        WHERE toLower(source.id) CONTAINS toLower($keyword)
        MATCH (source)-[r]-(target)
        RETURN 
            labels(source)[0] AS source_type,
            source.id AS source_name,
            type(r) AS relationship,
            labels(target)[0] AS target_type,
            target.id AS target_name
        """
        return self.graph.query(cypher_query, params={"keyword": keyword})

    def query_by_fulltext(self, search_term: str) -> list[Dict[str, Any]]:
        cypher_query = """
        CALL db.index.fulltext.queryNodes("entityIndex", $search_term) YIELD node AS source, score
        MATCH (source)-[r]-(target)
        RETURN 
            labels(source)[0] AS source_type,
            source.id AS source_name,
            type(r) AS relationship,
            labels(target)[0] AS target_type,
            target.id AS target_name,
            score
        ORDER BY score DESC
        """
        return self.graph.query(cypher_query, params={"search_term": f"{search_term}*"})