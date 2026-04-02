from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "fullstack-starter"
    PROJECT_ENV: Literal["local", "staging", "prod"] = "local"

    GOOGLE_CLOUD_PROJECT: str | None = None
    CLOUD_TASKS_QUEUE: str = "default"
    CLOUD_TASKS_LOCATION: str = "asia-northeast3"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
