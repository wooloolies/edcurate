import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base


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
        Index("ix_saved_resources_user_preset", "user_id", "preset_id"),
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
    search_query: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        server_default="",
    )
    resource_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    resource_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default="{}",
    )
    evaluation_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
