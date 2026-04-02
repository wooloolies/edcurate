import ssl
from collections.abc import AsyncGenerator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.lib.config import settings

# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    metadata = MetaData(naming_convention=convention)


# SSL context and PgBouncer compat for non-local environments
_connect_args: dict = {}
if "localhost" not in settings.DATABASE_URL and "127.0.0.1" not in settings.DATABASE_URL:
    _ssl_ctx = ssl.create_default_context()
    _connect_args["ssl"] = _ssl_ctx
    _connect_args["statement_cache_size"] = 0  # Required for PgBouncer transaction mode

# Use NullPool for serverless/non-local to avoid stale connections
_pool_class = NullPool if settings.PROJECT_ENV != "local" else None

# Async engine
_engine_kwargs: dict = {
    "echo": settings.PROJECT_ENV == "local",
    "pool_pre_ping": True,
    "connect_args": _connect_args,
}
if _pool_class is not None:
    _engine_kwargs["poolclass"] = _pool_class

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

# Async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for database session injection."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
