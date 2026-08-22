from typing import TypedDict
from services.articleontology import ArticleOntology
from langchain_core.documents import Document

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
    def make_gather_vector_data():
        async def gather_vector_data(state: OntologyGraphState) -> dict:
            return {}

        return gather_vector_data

    @staticmethod
    def make_store_relationship():
        async def store_relationship_entity(state: OntologyGraphNodes) -> dict:
            return {}

        return store_relationship_entity


""" 
Key aspects to implement
1. Get all chunks and deduplicate by comparing page_content and then aggregate them into a single context, this can be done via llm call
2. We need to understand how we want the graph to store the entities and relationships
3. Maybe this graph extends to query and update also, so as the graph is in a cycle its traversing the connections and updating where it sees fit


 ## System Workflow Diagram
    6
    7         Ontology LangGraph
    ⋮
    ⋮         ┌────────────────────────────────┐    ┌───────────┐
    ⋮         │ RabbitMQ Queue: ONTOLOGY_QUEUE │    │ doc_index │
    ⋮         └────────────────────────────────┘    └───────────┘
    ⋮                          │ OntologyEvent
    ⋮                          ▼
    ⋮         ┌────────────────────────────┐
    ⋮         │ CrawlOntologyEventConsumer │
    ⋮         └────────────────────────────┘
    ⋮                        │ ainvoke
    ⋮                        ▼
    ⋮         ┌────────────────────┐
    ⋮         │ Ontology LangGraph │
    ⋮         └────────────────────┘
    ⋮                    │
    ⋮                    ▼
    ⋮         ┌──────────────────────────┐
    ⋮         │ Node: gather_vector_data │
    ⋮         └──────────────────────────┘
    ⋮                       │ Initialize: doc_index = 0, accumulated_ontology = empty
    ⋮                       ▼
    ⋮         ◇───────────────────────────────────────◇
    ⋮         │ Loop Condition: doc_index < len_docs? │
    ⋮         ◇───────────────────────────────────────◇
    ⋮                             │ Yes: Process next chunk
    ⋮                             ▼
    ⋮         ┌──────────────────────────────────┐    ┌────────────────────────┐
    ⋮         │ Node: extract_ontology_for_chunk │    │ Node: store_in_graphdb │
    ⋮         └──────────────────────────────────┘    └────────────────────────┘
    ⋮                           │ Extract from retrieved_docs[doc_index]                 │ Save accumulated_ontology
    ⋮                           ▼                                  ▼
    ⋮         ┌───────────────────────┐    ┌─────────────────────────────┐    ┌────────────────────────┐
    ⋮         │ Ollama Structured LLM │    │ (Relational Graph Database) │    │ Workflow End / Success │
    ⋮         └───────────────────────┘    └─────────────────────────────┘    └────────────────────────┘
    ⋮
    ⋮         G ──Return ArticleOntology──► F
    ⋮         F ──Merge results & doc_index += 1──► E
"""