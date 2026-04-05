from fastapi import HTTPException

from src.auth.router import _send_verification_email_or_raise
from src.lib.config import (
    LOCAL_DATABASE_URL_SYNC,
    Settings,
    escape_alembic_url,
    to_sync_database_url,
)


def test_to_sync_database_url_converts_asyncpg_urls() -> None:
    async_url = "postgresql+asyncpg://user:pass@localhost:5432/edcurate"

    assert (
        to_sync_database_url(async_url)
        == "postgresql://user:pass@localhost:5432/edcurate"
    )


def test_settings_derives_sync_database_url() -> None:
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/edcurate",
        DATABASE_URL_SYNC=None,
    )

    assert (
        settings.DATABASE_URL_SYNC == "postgresql://user:pass@localhost:5432/edcurate"
    )


def test_escape_alembic_url_escapes_percent_signs() -> None:
    url = "postgresql://user:pa%21ss@host:6543/postgres"

    assert escape_alembic_url(url) == "postgresql://user:pa%%21ss@host:6543/postgres"


def test_settings_overrides_local_sync_default_for_remote_async_url() -> None:
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://user:pa%21ss@host:6543/postgres",
        DATABASE_URL_SYNC=LOCAL_DATABASE_URL_SYNC,
    )

    assert settings.DATABASE_URL_SYNC == "postgresql://user:pa%21ss@host:6543/postgres"


def test_send_verification_email_or_raise_converts_provider_failures(
    monkeypatch,
) -> None:
    def _raise(_email: str, _token: str) -> None:
        raise RuntimeError("provider down")

    monkeypatch.setattr("src.auth.router._send_verification_email", _raise)

    try:
        _send_verification_email_or_raise("user@example.com", "token")
    except HTTPException as exc:
        assert exc.status_code == 503
        assert "Verification email could not be sent" in str(exc.detail)
    else:
        raise AssertionError("Expected HTTPException")
