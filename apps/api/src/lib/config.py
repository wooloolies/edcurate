import json
import os
import tempfile
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def to_sync_database_url(url: str) -> str:
    """Convert async SQLAlchemy URLs to sync URLs for Alembic."""
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


def escape_alembic_url(url: str) -> str:
    """Escape percent signs for Alembic's ConfigParser-backed config."""
    return url.replace("%", "%%")


LOCAL_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/edcurate"
LOCAL_DATABASE_URL_SYNC = "postgresql://postgres:postgres@localhost:5432/edcurate"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project
    PROJECT_NAME: str = "edcurate-api"
    PROJECT_ENV: Literal["local", "staging", "prod"] = "local"

    # Database
    DATABASE_URL: str = LOCAL_DATABASE_URL
    DATABASE_URL_SYNC: str | None = None

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Auth (better-auth)
    BETTER_AUTH_URL: str = "http://localhost:3000"

    # JWE (stateless authentication)
    JWE_SECRET_KEY: str = "your-super-secret-jwe-encryption-key-change-in-production"  # noqa: S105

    # Redis (optional)
    REDIS_URL: str | None = None

    # Weaviate (optional — pgvector via Supabase is the default)
    WEAVIATE_URL: str | None = None
    WEAVIATE_API_KEY: str | None = None

    # OpenTelemetry (optional)
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_SERVICE_NAME: str | None = None

    # AI (optional)
    AI_PROVIDER: Literal["gemini", "openai"] = "gemini"
    GOOGLE_CLOUD_PROJECT: str | None = None
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None
    GOOGLE_CREDENTIALS_JSON: str | None = None  # JSON string for serverless
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # Email (optional — skip verification when absent)
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "noreply@edcurate.com"
    FRONTEND_URL: str = "http://localhost:3000"

    # Search providers (optional)
    YOUTUBE_API_KEY: str | None = None
    OPENALEX_API_KEY: str | None = None

    # NotebookLM (optional)
    NOTEBOOKLM_STORAGE_STATE_PATH: str | None = None
    NOTEBOOKLM_STATE: str | None = None  # JSON content (for serverless)

    # Storage (optional)
    STORAGE_BACKEND: Literal["gcs", "s3", "minio"] = "minio"
    GCS_BUCKET_NAME: str | None = None
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"  # noqa: S105

    @model_validator(mode="after")
    def _check_secrets(self) -> "Settings":
        # Serverless: GOOGLE_CREDENTIALS_JSON contains the service account
        # key as a JSON string.  Write it to a temp file so Google SDKs
        # (which expect a file path) can pick it up via ADC.
        if self.GOOGLE_CREDENTIALS_JSON and not self.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                creds = json.loads(self.GOOGLE_CREDENTIALS_JSON)
                tmp = tempfile.NamedTemporaryFile(
                    mode="w", suffix=".json", delete=False
                )
                json.dump(creds, tmp)
                tmp.close()
                self.GOOGLE_APPLICATION_CREDENTIALS = tmp.name
                if not self.GOOGLE_CLOUD_PROJECT and creds.get("project_id"):
                    self.GOOGLE_CLOUD_PROJECT = creds["project_id"]
            except (json.JSONDecodeError, OSError):
                pass  # fall through — Gemini calls will fail with a clear error

        if self.GOOGLE_APPLICATION_CREDENTIALS:
            # Set environment variable for Google SDKs
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
                self.GOOGLE_APPLICATION_CREDENTIALS
            )

        if not self.DATABASE_URL_SYNC or (
            self.DATABASE_URL_SYNC == LOCAL_DATABASE_URL_SYNC
            and self.DATABASE_URL != LOCAL_DATABASE_URL
        ):
            self.DATABASE_URL_SYNC = to_sync_database_url(self.DATABASE_URL)

        if self.PROJECT_ENV != "local":
            defaults = [
                (
                    "JWE_SECRET_KEY",
                    "your-super-secret-jwe-encryption-key-change-in-production",
                ),
            ]
            for name, default_val in defaults:
                if getattr(self, name) == default_val:
                    raise ValueError(
                        f"{name} must be changed from default"
                        f" in {self.PROJECT_ENV} environment"
                    )
        return self


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
