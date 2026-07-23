from langchain_ollama import OllamaEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

class EmbeddingService:

    def __init__(self, model_uri: str, model_name: str, vector_store_connection_string: str) -> None:
        self.vector_store = PGVector(
            embeddings= OllamaEmbeddings(model=model_name, base_url= model_uri),
            use_jsonb= True,
            connection= vector_store_connection_string
        )   

    def generate_and_save_embedding(self, request: str) -> list[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=150,
            length_function=len,
            is_separator_regex=False,
        )
        chunks = text_splitter.split_text(request)
        result = self.vector_store.add_texts(chunks)
        return result

    def search(self, search_query: str, k :int =  1) -> list[Document]:
        results = self.vector_store.similarity_search(search_query, k)
        return results 