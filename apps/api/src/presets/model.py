import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base

_DEFAULT_SOURCE_WEIGHTS = '{"ddgs": 0.34, "youtube": 0.33, "openalex": 0.33}'


class ClassroomPreset(Base):
    """Classroom context preset model."""

    __tablename__ = "classroom_presets"

    __table_args__ = (
        CheckConstraint(
            "class_size IS NULL OR class_size > 0",
            name="class_size",
        ),
        CheckConstraint(
            "eal_d_students IS NULL OR eal_d_students >= 0",
            name="eal_d",
        ),
        CheckConstraint(
            "reading_support_students IS NULL OR reading_support_students >= 0",
            name="reading_support",
        ),
        CheckConstraint(
            "extension_students IS NULL OR extension_students >= 0",
            name="extension",
        ),
        CheckConstraint(
            "(source_weights->>'ddgs')::numeric BETWEEN 0 AND 1 AND "
            "(source_weights->>'youtube')::numeric BETWEEN 0 AND 1 AND "
            "(source_weights->>'openalex')::numeric BETWEEN 0 AND 1",
            name="source_weights_range",
        ),
        CheckConstraint(
            "ABS("
            "COALESCE((source_weights->>'ddgs')::numeric, 0) + "
            "COALESCE((source_weights->>'youtube')::numeric, 0) + "
            "COALESCE((source_weights->>'openalex')::numeric, 0) - 1.0"
            ") <= 0.01",
            name="source_weights_sum",
        ),
        Index("ix_classroom_presets_user_id", "user_id"),
        Index(
            "uq_classroom_presets_user_default",
            "user_id",
            unique=True,
            postgresql_where=text("is_default = true"),
        ),
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

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_default: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    curriculum_framework: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    year_level: Mapped[str] = mapped_column(String(50), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state_region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    teaching_language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en", server_default="en"
    )

    class_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    eal_d_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reading_support_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extension_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    student_interests: Mapped[list] = mapped_column(
        JSONB, default=list, server_default="[]"
    )
    language_backgrounds: Mapped[list] = mapped_column(
        JSONB, default=list, server_default="[]"
    )
    average_reading_level: Mapped[str | None] = mapped_column(String(50), nullable=True)

    source_weights: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: {"ddgs": 0.34, "youtube": 0.33, "openalex": 0.33},
        server_default=_DEFAULT_SOURCE_WEIGHTS,
    )

    additional_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
