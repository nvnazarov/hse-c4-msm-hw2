from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SqliteConfig(BaseSettings):
    db: str = "/tmp/app/storage.db"


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="app_", env_nested_delimiter="__")
    host: str = "127.0.0.1"
    port: int = 8080
    sqlite: SqliteConfig = Field(default_factory=SqliteConfig)

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
