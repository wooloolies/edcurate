import secrets
from logging import getLogger
from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from src.lib.auth import (
    EmailLoginRequest,
    OAuthLoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_oauth_token,
)
from src.lib.config import settings
from src.lib.dependencies import DBSession
from src.users.model import User

router = APIRouter()
logger = getLogger(__name__)

# Verification tokens: token → (user_id, expires_at)
_verification_tokens: dict[str, tuple[str, datetime]] = {}


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _send_verification_email(email: str, token: str) -> None:
    """Send verification email via Resend. No-op if key not set."""
    if not settings.RESEND_API_KEY:
        return

    import resend

    resend.api_key = settings.RESEND_API_KEY
    verify_url = f"{settings.FRONTEND_URL}/api/auth/verify-email?token={token}"
    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Verify your Edcurate account",
            "html": (
                "<p>Click the link below to verify your email:</p>"
                f'<p><a href="{verify_url}">Verify Email</a></p>'
                "<p>This link expires in 24 hours.</p>"
            ),
        }
    )


def _send_verification_email_or_raise(email: str, token: str) -> None:
    """Translate email provider failures into an explicit API error."""
    try:
        _send_verification_email(email, token)
    except Exception as exc:
        logger.exception("Verification email delivery failed for %s", email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification email could not be sent. Verify your Resend domain or try again later.",
        ) from exc


class RegisterResponse(BaseModel):
    """Registration response — tokens if no verification needed."""

    access_token: str | None = None
    refresh_token: str | None = None
    requires_verification: bool = False
    message: str


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: RegisterRequest,
    db: DBSession,
) -> RegisterResponse:
    """Register a new user with email and password."""
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    needs_verification = bool(settings.RESEND_API_KEY)

    user = User(
        email=request.email,
        name=request.name,
        password_hash=_hash_password(request.password),
        email_verified=not needs_verification,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    if needs_verification:
        token = secrets.token_urlsafe(32)
        expires = datetime.now(UTC) + timedelta(hours=24)
        _verification_tokens[token] = (str(user.id), expires)
        _send_verification_email_or_raise(request.email, token)
        return RegisterResponse(
            requires_verification=True,
            message="Verification email sent. Please check your inbox.",
        )

    return RegisterResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        requires_verification=False,
        message="Account created successfully.",
    )


@router.get("/verify-email")
async def verify_email(
    token: str = Query(...),
    db: DBSession = ...,
) -> dict[str, str]:
    """Verify email address via token from verification link."""
    entry = _verification_tokens.pop(token, None)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user_id, expires_at = entry
    if datetime.now(UTC) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token expired",
        )

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.email_verified = True
    await db.flush()

    return {"message": "Email verified successfully. You can now sign in."}


@router.post("/email-login", response_model=TokenResponse)
async def email_login(
    request: EmailLoginRequest,
    db: DBSession,
) -> TokenResponse:
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not _verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Block login if email not verified (production only)
    if not user.email_verified and settings.RESEND_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def oauth_login(
    request: OAuthLoginRequest,
    db: DBSession,
) -> TokenResponse:
    """OAuth login — verify provider token, create/update user."""
    user_info = await verify_oauth_token(request.provider, request.access_token)

    result = await db.execute(select(User).where(User.email == user_info.email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=user_info.email,
            name=user_info.name,
            image=user_info.image,
            email_verified=user_info.email_verified,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: DBSession,
) -> TokenResponse:
    """Refresh access token using refresh token."""
    payload = decode_token(request.refresh_token)

    if payload.token_type != "refresh":  # noqa: S105
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    result = await db.execute(select(User).where(User.id == UUID(payload.user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=request.refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout() -> None:
    """Logout — client should remove tokens from localStorage."""
    return None
