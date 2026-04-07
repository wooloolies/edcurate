import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base


class GeneratedArtifact(Base):
    """Generated learning artifact from NotebookLM."""

    __tablename__ = "generated_artifacts"
    __table_args__ = (
        Index("ix_generated_artifacts_user_preset", "user_id", "preset_id"),
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
    artifact_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    content: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default="{}",
    )
    source_resource_ids: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
