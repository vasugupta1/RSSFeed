import logging
from typing import TypedDict
from models.articleontology import ArticleOntology
from langchain_core.documents import Document
from repository.graphservice import GraphService
from repository.embedding import EmbeddingService
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

class DocumentReducer:
    @staticmethod
    def merge_docs(left : list[Document] | None, right: list[Document]) -> list[Document]:
        left = left or []
        right = right or []
        seen_keys = { (doc.metadata.get("doc_id"), doc.metadata.get("chunk_index")) for doc in left}
        merged = list(left)
        duplicates = 0
        for doc in right:
            key = (doc.metadata.get("doc_id"), doc.metadata.get("chunk_index"))
            if key not in seen_keys:
                merged.append(doc)
                seen_keys.add(key)
            else:
                duplicates += 1
        
        if duplicates > 0:
            logger.info(f"[DocumentReducer] Merged {len(right) - duplicates} new documents, skipped {duplicates} duplicates.")
        else:
            logger.info(f"[DocumentReducer] Merged {len(right)} new documents.")
            
        return merged
        


class OntologyGraphState(TypedDict, total=False):
    """ Inputs """
    keywords: list[str]
    country:str
    title:str
    search_queries: list[str]

    """ Generated Data"""
    retrieved_doc: list[Document]
    aggregated_context:str
    ontology: ArticleOntology
    status:str


class OntologyGraphNodes:
    @staticmethod
    def make_gather_keyword_related_data(embedding_service: EmbeddingService):
        async def gather_vector_data(state: OntologyGraphState) -> dict:
            keywords = state.get("keywords", [])
            existing_docs = state.get("retrieved_doc", [])
            logger.info(f"[OntologyGraph Node: gather_vector_data] Starting vector search for {len(keywords)} keywords: {keywords}")
            
            docs: list[Document] = []
            for k in keywords:
                gen = embedding_service.search(search_query= k)
                docs.extend(list(gen))
                
            logger.info(f"[OntologyGraph Node: gather_vector_data] Vector search returned {len(docs)} total document chunks.")
            return {"retrieved_doc": DocumentReducer.merge_docs(existing_docs, docs)}

        return gather_vector_data

    @staticmethod
    def make_store_relationship(graph_service: GraphService):
        async def store_relationship_entity(state: OntologyGraphState) -> dict:
            docs = state.get("retrieved_doc", [])
            logger.info(f"[OntologyGraph Node: store_relationship_entity] Storing relationships for {len(docs)} documents into Neo4j graph database.")

            graph_service.insert_to_graph_docs(docs)
                  
            logger.info("[OntologyGraph Node: store_relationship_entity] Graph database storage complete.")
            return {}

        return store_relationship_entity


class OntologyGraph:
    def __init__(self,
                embedding_service: EmbeddingService,
                graph_service: GraphService):
         self.embedding_service = embedding_service
         self.graph_service = graph_service

    def build_graph(self):

        graph = StateGraph(OntologyGraphState)

        graph.add_node(
            "gather_vector_data",
            OntologyGraphNodes.make_gather_keyword_related_data(
                self.embedding_service
            )
        )

        graph.add_node(
            "store_relationship_entity",
            OntologyGraphNodes.make_store_relationship(
                self.graph_service
            )
        )

        graph.set_entry_point("gather_vector_data")
        graph.add_edge("gather_vector_data", "store_relationship_entity")
        graph.add_edge("store_relationship_entity", END)
        return graph.compile()
