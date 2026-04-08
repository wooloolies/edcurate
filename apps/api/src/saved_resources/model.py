import uuid as uuid_lib
from datetime import datetime
from typing import Any

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base


class LibraryCollection(Base):
    """Collection wrapper for saved resources."""

    __tablename__ = "library_collections"
    __table_args__ = (
        Index("ix_library_collections_public", "is_public"),
        Index("ix_library_collections_user", "user_id"),
        Index("ix_library_collections_preset", "preset_id"),
    )

    id: Mapped[uuid_lib.UUID] = mapped_column(
        primary_key=True,
        default=uuid_lib.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    preset_id: Mapped[uuid_lib.UUID] = mapped_column(
        ForeignKey("classroom_presets.id", ondelete="CASCADE"),
        nullable=False,
    )
    search_query: Mapped[str] = mapped_column(String(512), nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(
        nullable=False, default=False, server_default="false"
    )
    clone_count: Mapped[int] = mapped_column(
        nullable=False, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    cloned_from_id: Mapped[uuid_lib.UUID | None] = mapped_column(
        ForeignKey("library_collections.id", ondelete="SET NULL"),
        nullable=True,
    )


class SavedResource(Base):
    """Saved resource bookmark model."""

    __tablename__ = "saved_resources"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "preset_id",
            "search_query",
            "resource_url",
            name="uq_saved_resource_v2",
        ),
        Index("ix_saved_resources_collection", "collection_id"),
        Index("ix_saved_resources_user_preset", "user_id", "preset_id"),
    )

    id: Mapped[uuid_lib.UUID] = mapped_column(
        primary_key=True,
        default=uuid_lib.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    collection_id: Mapped[uuid_lib.UUID | None] = mapped_column(
        ForeignKey("library_collections.id", ondelete="CASCADE"),
        nullable=True,
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    preset_id: Mapped[uuid_lib.UUID] = mapped_column(
        ForeignKey("classroom_presets.id", ondelete="CASCADE"),
        nullable=False,
    )
    search_query: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        server_default="",
    )
    resource_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    resource_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="{}",
    )
    evaluation_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True
    )

    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
