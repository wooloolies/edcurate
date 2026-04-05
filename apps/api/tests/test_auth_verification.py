from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from src.auth.router import resend_verification_email, verify_email
from src.lib.auth import (
    ResendVerificationRequest,
    create_email_verification_token,
    decode_email_verification_token,
)


def test_email_verification_token_round_trip() -> None:
    user_id = str(uuid4())

    token = create_email_verification_token(user_id)
    payload = decode_email_verification_token(token)

    assert payload.user_id == user_id
    assert payload.token_type == "email_verification"  # noqa: S105


@pytest.mark.asyncio
async def test_verify_email_marks_user_verified_without_in_memory_token_store() -> None:
    user = SimpleNamespace(id=uuid4(), email_verified=False)
    token = create_email_verification_token(str(user.id))

    class _Result:
        def scalar_one_or_none(self) -> SimpleNamespace:
            return user

    class _DB:
        async def execute(self, _query: object) -> _Result:
            return _Result()

        async def flush(self) -> None:
            return None

    response = await verify_email(token=token, db=_DB())

    assert response == {"message": "Email verified successfully. You can now sign in."}
    assert user.email_verified is True


@pytest.mark.asyncio
async def test_verify_email_rejects_invalid_token() -> None:
    class _DB:
        async def execute(self, _query: object) -> None:
            raise AssertionError("DB should not be touched for invalid tokens")

        async def flush(self) -> None:
            raise AssertionError("DB should not be touched for invalid tokens")

    with pytest.raises(HTTPException) as exc_info:
        await verify_email(token="invalid-token", db=_DB())  # noqa: S106

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid or expired verification token"


@pytest.mark.asyncio
async def test_resend_verification_email_sends_for_unverified_user(monkeypatch) -> None:
    user = SimpleNamespace(id=uuid4(), email="user@example.com", email_verified=False)
    sent: dict[str, str] = {}

    class _Result:
        def scalar_one_or_none(self) -> SimpleNamespace:
            return user

    class _DB:
        async def execute(self, _query: object) -> _Result:
            return _Result()

    def _fake_send(email: str, token: str) -> None:
        sent["email"] = email
        sent["token"] = token

    monkeypatch.setattr("src.auth.router._send_verification_email_or_raise", _fake_send)
    monkeypatch.setattr("src.auth.router.settings.RESEND_API_KEY", "test-key")

    response = await resend_verification_email(
        ResendVerificationRequest(email=user.email),
        db=_DB(),
    )

    assert response["message"].startswith("If an unverified account exists")
    assert sent["email"] == user.email
    assert decode_email_verification_token(sent["token"]).user_id == str(user.id)
