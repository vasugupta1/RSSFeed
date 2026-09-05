from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfiguration(BaseSettings):
    """Configuration for the research worker.

    Dependency chain requires:
    - LLM: used by RSSAnalyserService, ResearchGeneratorService, AnalysisValidator
    - Embeddings / PGVector: used by EmbeddingService for storing research results
    - RabbitMQ: consumer reads from CRAWL_RESEARCH_EVENT_QUEUE, publisher writes to ONTOLOOGY_QUEUE
    - NO Neo4j: this worker doesn't touch the graph database
    """
    LLM_URI: str = Field(...)
    LLM_MODEL: str = Field(...)
    MESSAGING_URI: str = Field(...)
    CRAWL_RESEARCH_EVENT_QUEUE: str = Field(..., validation_alias="RABITMQ_CRAWL_RESEARCH_QUEUE")
    ONTOLOOGY_QUEUE: str = Field(..., validation_alias="RABBITMQ_ONTOLOOGY_QUEUE")
    VECTOR_DATBASE_URI: str = Field(..., validation_alias="RESSFEEDVECTORS_URI")
    EMBEDDING_MODEL: str = Field(..., validation_alias="EMBEDDINGS_MODEL")
    EMBEDDING_URI: str = Field(..., validation_alias="EMBEDDINGS_URI")

    # Metrics Telemetry (Injected automatically by Aspire)
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = Field(default=None)
    OTEL_SERVICE_NAME: str = Field(default="research-worker")

    model_config = SettingsConfigDict(extra="ignore")
