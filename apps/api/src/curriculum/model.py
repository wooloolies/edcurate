from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.database import Base


class CurriculumEntry(Base):
    """Read-only curriculum reference data for cascading dropdowns."""

    __tablename__ = "curriculum_entries"

    __table_args__ = (
        UniqueConstraint(
            "country_code",
            "subject",
            "framework",
            "grade",
            name="uq_curriculum_entries_country_subject_framework_grade",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    country_code: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    country_name: Mapped[str] = mapped_column(String(100), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    framework: Mapped[str] = mapped_column(String(255), nullable=False)
    grade: Mapped[str] = mapped_column(String(50), nullable=False)
    grade_sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
