"""Resource evaluation persistence model."""

import uuid as uuid_lib
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base


class ResourceEvaluation(Base):
    """Stores per-resource AI judgment results for a given user/preset/query context."""

    __tablename__ = "resource_evaluations"

    __table_args__ = (
        Index(
            "ix_resource_evaluations_lookup",
            "preset_id",
            "resource_url",
            "search_query",
        ),
        Index("ix_resource_evaluations_user_id", "user_id"),
    )

    id: Mapped[uuid_lib.UUID] = mapped_column(
        primary_key=True,
        default=uuid_lib.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(nullable=False)
    preset_id: Mapped[uuid_lib.UUID] = mapped_column(nullable=False)
    resource_url: Mapped[str] = mapped_column(Text, nullable=False)
    search_query: Mapped[str] = mapped_column(Text, nullable=False)
    judgment_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="{}",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
