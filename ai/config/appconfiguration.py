import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfiguration(BaseSettings):
    CHAT_URI: str = Field(...)
    CHAT_MODEL: str = Field(...)
    ONTOLOGY_URI: str = Field(..., validation_alias="ONOTOLOGY_URI")
    ONTOLOGY_MODEL: str = Field(..., validation_alias="ONOTOLOGY_MODEL")
    DATABASE_URI: str = Field(..., validation_alias="RSSFEEDONTOLOGY_URI")
    MESSAGING_URI: str = Field(...)

    model_config = SettingsConfigDict(extra="ignore")