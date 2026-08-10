from langchain_ollama import OllamaEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import create_engine, text
from typing import Generator
import uuid

class EmbeddingService:

    def __init__(self, model_uri: str, model_name: str, vector_store_connection_string: str) -> None:
        self.vector_store = PGVector(
            embeddings= OllamaEmbeddings(model=model_name, base_url= model_uri),
            use_jsonb= True,
            connection= vector_store_connection_string
        )   
        self.engine = create_engine(vector_store_connection_string)

    def generate_and_save_embedding(self, request: str, metadata: dict[str, list[str]]) -> list[str]:
        doc_id = str(uuid.uuid4)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            length_function=len,
            is_separator_regex=False,
        )
        chunks = text_splitter.split_text(request)

        chunk_metadatas = []
        chunk_ids = []

        for idx,_ in enumerate(chunks):
            chunk_md = {
                **metadata,
                "doc_id": doc_id,
                "chunk_index": idx,
                "total_chunks": len(chunks)
            }
            chunk_metadatas.append(chunk_md)
            chunk_ids.append(f"{doc_id}_chunk_{idx}")

        result = self.vector_store.add_texts(texts = chunks, ids= chunk_ids, metadatas= chunk_metadatas)
        return result

    def search(self, search_query: str, k: int =  5) -> Generator[Document]:
        results = self.vector_store.similarity_search_with_relevance_scores(
                search_query, 
                k=k, 
                score_threshold = 0.5
            )
        for doc, _ in results:
            yield doc

    def can_connect(self) -> bool:
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False