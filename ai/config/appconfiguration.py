import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfiguration(BaseSettings):
    LLM_URI: str = Field(...)
    LLM_MODEL: str = Field(...)
    DATABASE_URI: str = Field(..., validation_alias="RSSFEEDONTOLOGY_URI")
    MESSAGING_URI: str = Field(...)
    ONTOLOOGY_QUEUE: str = Field(..., validation_alias= "RABBITMQ_ONTOLOOGY_QUEUE")
    CRAWL_QUEUE: str = Field(..., validation_alias= "RABBITMQ_CRAWL_QUEUE")
    CRAWL_RESULT_QUEUE: str = Field(..., validation_alias= "RABBITMQ_CRAWL_RESULT_QUEUE")

    model_config = SettingsConfigDict(extra="ignore")