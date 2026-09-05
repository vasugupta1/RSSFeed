from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfiguration(BaseSettings):
    """Configuration for the crawl worker.

    Dependency chain requires:
    - LLM: used by RSSAnalyserService and AnalysisValidator
    - Embeddings / PGVector: used by EmbeddingService for storing crawled content
    - RabbitMQ: consumer reads from CRAWL_QUEUE, publisher writes to CRAWL_RESULT_EXCHANGE
    - NO Neo4j: this worker doesn't touch the graph database
    """
    LLM_URI: str = Field(...)
    LLM_MODEL: str = Field(...)
    MESSAGING_URI: str = Field(...)
    CRAWL_QUEUE: str = Field(..., validation_alias="RABBITMQ_CRAWL_QUEUE")
    CRAWL_RESULT_EXCHANGE: str = Field(..., validation_alias="RABBITMQ_CRAWL_EXCHANGE")
    VECTOR_DATBASE_URI: str = Field(..., validation_alias="RESSFEEDVECTORS_URI")
    EMBEDDING_MODEL: str = Field(..., validation_alias="EMBEDDINGS_MODEL")
    EMBEDDING_URI: str = Field(..., validation_alias="EMBEDDINGS_URI")

    model_config = SettingsConfigDict(extra="ignore")
