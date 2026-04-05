import json
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from functools import wraps
from hashlib import sha256
from typing import Annotated, Any, Literal

import httpx
from fastapi import Depends, HTTPException, Request, status
from jwcrypto import jwe, jwk
from jwcrypto.common import JWException
from pydantic import BaseModel

from src.lib.config import settings


class TokenPayload(BaseModel):
    """JWT/JWE token payload."""

    user_id: str
    token_type: Literal["access", "refresh"]
    exp: int
    iat: int


class EmailVerificationTokenPayload(BaseModel):
    """Email verification token payload."""

    user_id: str
    token_type: Literal["email_verification"]
    exp: int
    iat: int


class TokenResponse(BaseModel):
    """Token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"  # noqa: S105


class OAuthLoginRequest(BaseModel):
    """OAuth login request."""

    provider: Literal["google", "github", "facebook"]
    access_token: str
    email: str
    name: str | None = None


class SessionExchangeRequest(BaseModel):
    """Exchange better-auth session token for backend JWE tokens."""

    session_token: str


class InternalExchangeRequest(BaseModel):
    """Internal token exchange — pre-verified by Next.js server."""

    email: str
    name: str | None = None


class RegisterRequest(BaseModel):
    """Email/password registration."""

    email: str
    password: str
    name: str | None = None


class ResendVerificationRequest(BaseModel):
    """Resend email verification request."""

    email: str


class EmailLoginRequest(BaseModel):
    """Email/password login."""

    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class OAuthUserInfo(BaseModel):
    """OAuth user information from provider."""

    id: str
    email: str | None = None
    name: str | None = None
    image: str | None = None
    email_verified: bool = False


class CurrentUserInfo(BaseModel):
    """Current authenticated user info."""

    id: str
    email: str | None = None
    name: str | None = None
    image: str | None = None
    email_verified: bool = False


def _get_jwe_key() -> jwk.JWK:
    """Get JWK key for JWE encryption/decryption using HKDF-like derivation."""
    key_bytes = sha256(settings.JWE_SECRET_KEY.encode("utf-8")).digest()[:32]
    return jwk.JWK(kty="oct", k=jwk.base64url_encode(key_bytes))


def _encode_token(payload: dict[str, Any]) -> str:
    """Create a compact JWE token from a JSON payload."""
    key = _get_jwe_key()
    jwe_token = jwe.JWE(
        json.dumps(payload).encode("utf-8"),
        recipient=key,
        protected={"alg": "A256KW", "enc": "A256GCM"},
    )
    return str(jwe_token.serialize(compact=True))


def _decode_raw_token(token: str) -> dict[str, Any]:
    """Decode a compact JWE token into a JSON payload."""
    key = _get_jwe_key()
    jwe_token = jwe.JWE()
    jwe_token.deserialize(token)
    jwe_token.decrypt(key)
    payload = json.loads(jwe_token.payload.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Invalid token payload")
    return payload


def create_access_token(user_id: str) -> str:
    """Create JWE access token."""
    now = datetime.now(UTC)
    payload = {
        "user_id": user_id,
        "token_type": "access",
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "iat": int(now.timestamp()),
    }

    return _encode_token(payload)


def create_refresh_token(user_id: str) -> str:
    """Create JWE refresh token."""
    now = datetime.now(UTC)
    payload = {
        "user_id": user_id,
        "token_type": "refresh",
        "exp": int((now + timedelta(days=7)).timestamp()),
        "iat": int(now.timestamp()),
    }

    return _encode_token(payload)


def create_email_verification_token(user_id: str) -> str:
    """Create JWE email verification token."""
    now = datetime.now(UTC)
    payload = {
        "user_id": user_id,
        "token_type": "email_verification",
        "exp": int((now + timedelta(hours=24)).timestamp()),
        "iat": int(now.timestamp()),
    }

    return _encode_token(payload)


def decode_token(token: str) -> TokenPayload:
    """Decode and validate JWE token."""
    try:
        token_payload = TokenPayload(**_decode_raw_token(token))
        if datetime.now(UTC).timestamp() > token_payload.exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_payload
    except JWException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


def decode_email_verification_token(token: str) -> EmailVerificationTokenPayload:
    """Decode and validate an email verification token."""
    try:
        token_payload = EmailVerificationTokenPayload(**_decode_raw_token(token))
        if datetime.now(UTC).timestamp() > token_payload.exp:
            raise ValueError("Verification token expired")
        return token_payload
    except (JWException, ValueError):
        raise ValueError("Invalid or expired verification token") from None
    except Exception:
        raise ValueError("Invalid or expired verification token") from None


async def verify_google_token(access_token: str) -> OAuthUserInfo:
    """Verify Google OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google access token",
            )
        data = response.json()
        return OAuthUserInfo(
            id=data["sub"],
            email=data["email"],
            name=data.get("name"),
            image=data.get("picture"),
            email_verified=data.get("email_verified", False),
        )


async def verify_github_token(access_token: str) -> OAuthUserInfo:
    """Verify GitHub OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub access token",
            )
        data = response.json()
        email = data.get("email")
        if not email:
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=5.0,
            )
            if emails_response.status_code == 200:
                for e in emails_response.json():
                    if e.get("primary") and e.get("verified"):
                        email = e["email"]
                        break
        return OAuthUserInfo(
            id=str(data["id"]),
            email=email,
            name=data.get("name"),
            image=data.get("avatar_url"),
        )


async def verify_facebook_token(access_token: str) -> OAuthUserInfo:
    """Verify Facebook OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.facebook.com/me?fields=id,email,name,picture",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Facebook access token",
            )
        data = response.json()
        picture_url = data.get("picture", {}).get("data", {}).get("url")
        return OAuthUserInfo(
            id=data["id"],
            email=data.get("email"),
            name=data.get("name"),
            image=picture_url,
        )


async def verify_session_token(session_token: str) -> OAuthUserInfo:
    """Verify better-auth session token and extract user info."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.BETTER_AUTH_URL}/api/auth/get-session",
            headers={
                "Authorization": f"Bearer {session_token}",
                "Cookie": f"better-auth.session_token={session_token}",
            },
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token",
            )
        data = response.json()
        if not data or not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session response",
            )
        user = data.get("user")
        if not user or not isinstance(user, dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session: no user",
            )
        user_id = user.get("id", "")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session: no user ID",
            )
        email = user.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session: no email",
            )
        return OAuthUserInfo(
            id=user_id,
            email=email,
            name=user.get("name"),
            image=user.get("image"),
            email_verified=user.get("emailVerified", False),
        )


async def verify_oauth_token(provider: str, access_token: str) -> OAuthUserInfo:
    """Verify OAuth token based on provider."""
    if provider == "google":
        return await verify_google_token(access_token)
    elif provider == "github":
        return await verify_github_token(access_token)
    elif provider == "facebook":
        return await verify_facebook_token(access_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )


async def get_current_user(request: Request) -> CurrentUserInfo:
    """Get current authenticated user from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.replace("Bearer ", "")
    payload = decode_token(token)

    if payload.token_type != "access":  # noqa: S105
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    return CurrentUserInfo(id=payload.user_id)


async def get_optional_user(request: Request) -> CurrentUserInfo | None:
    """Get current user if authenticated, otherwise None."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


CurrentUser = Annotated[CurrentUserInfo, Depends(get_current_user)]
OptionalUser = Annotated[CurrentUserInfo | None, Depends(get_optional_user)]


def require_auth(
    func: Callable[..., Any] | None = None,
) -> Callable[..., Any]:
    """Decorator to require authentication on a route.

    Usage:
        @router.get("/protected")
        @require_auth
        async def protected_route(user: CurrentUser):
            return {"user": user}
    """

    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            return await f(*args, **kwargs)

        return wrapper

    if func is not None:
        return decorator(func)
    return decorator
