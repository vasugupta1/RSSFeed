from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfiguration(BaseSettings):
    """Configuration for the ontology worker.

    Only includes settings required by the ontology consumer's dependency chain:
    - LLM: used by GraphService's LLMGraphTransformer for Neo4j ingestion
    - Neo4j: graph database for entity/relationship storage
    - RabbitMQ: message queue the consumer reads from
    - PGVector / Embeddings: vector store used for keyword similarity search
    """
    LLM_URI: str = Field(...)
    LLM_MODEL: str = Field(...)
    NEO4J_URI: str = Field(..., validation_alias= "NEO4J_URI")
    MESSAGING_URI: str = Field(...)
    ONTOLOOGY_QUEUE: str = Field(..., validation_alias= "RABBITMQ_ONTOLOOGY_QUEUE")
    VECTOR_DATBASE_URI: str = Field(..., validation_alias="RESSFEEDVECTORS_URI")
    EMBEDDING_MODEL: str = Field(..., validation_alias="EMBEDDINGS_MODEL")
    EMBEDDING_URI: str = Field(..., validation_alias="EMBEDDINGS_URI")

    # Metrics Telemetry (Injected automatically by Aspire)
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = Field(default=None)
    OTEL_SERVICE_NAME: str = Field(default="ontology-worker")

    model_config = SettingsConfigDict(extra="ignore", env_file=".env")
