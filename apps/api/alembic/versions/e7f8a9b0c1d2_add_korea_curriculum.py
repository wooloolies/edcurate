"""add korea curriculum entries

Revision ID: e7f8a9b0c1d2
Revises: 30d7f3982ea9
Create Date: 2026-04-08 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import column, table

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: str | None = "30d7f3982ea9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _make_rows(
    country_code: str,
    country_name: str,
    subject: str,
    framework: str,
    grades: list[tuple[str, int]],
) -> list[dict]:
    return [
        {
            "country_code": country_code,
            "country_name": country_name,
            "subject": subject,
            "framework": framework,
            "grade": grade,
            "grade_sort": sort,
            "is_active": True,
        }
        for grade, sort in grades
    ]


def upgrade() -> None:
    curriculum_entries_table = table(
        "curriculum_entries",
        column("country_code", sa.String),
        column("country_name", sa.String),
        column("subject", sa.String),
        column("framework", sa.String),
        column("grade", sa.String),
        column("grade_sort", sa.Integer),
        column("is_active", sa.Boolean),
    )

    # South Korea - 2022 Revised National Curriculum (교육부 고시 제2022-33호)
    # Phased rollout: 2024 elementary 1-2, 2025 elementary 3-4 / middle 1 / high 1,
    # 2026 elementary 5-6 / middle 2 / high 2, 2027 middle 3 / high 3
    # By 2027 all grades are on the revised curriculum.

    framework = "2022 Revised National Curriculum"

    # Grade structure (Korean school system maps to Grades 1-12)
    elementary = [(f"Grade {i}", i) for i in range(1, 7)]
    middle = [(f"Grade {i}", i) for i in range(7, 10)]
    high = [(f"Grade {i}", i) for i in range(10, 13)]

    all_grades = elementary + middle + high  # Grade 1-12
    middle_high = middle + high  # Grade 7-12

    rows: list[dict] = []

    # Korean Language - Grade 1-12
    rows += _make_rows("KR", "South Korea", "Korean Language", framework, all_grades)

    # Mathematics - Grade 1-12
    rows += _make_rows("KR", "South Korea", "Mathematics", framework, all_grades)

    # English - Grade 3-12 (starts from elementary 3rd grade)
    rows += _make_rows(
        "KR",
        "South Korea",
        "English",
        framework,
        [(f"Grade {i}", i) for i in range(3, 13)],
    )

    # Science - Grade 3-12 (starts from elementary 3rd grade)
    rows += _make_rows(
        "KR",
        "South Korea",
        "Science",
        framework,
        [(f"Grade {i}", i) for i in range(3, 13)],
    )

    # Social Studies - Grade 3-12 (starts from elementary 3rd grade)
    rows += _make_rows(
        "KR",
        "South Korea",
        "Social Studies",
        framework,
        [(f"Grade {i}", i) for i in range(3, 13)],
    )

    # Informatics - Grade 7-12 (mandatory from middle school, doubled hours to 68+)
    rows += _make_rows("KR", "South Korea", "Informatics", framework, middle_high)

    op.bulk_insert(curriculum_entries_table, rows)


def downgrade() -> None:
    op.execute("DELETE FROM curriculum_entries WHERE country_code = 'KR'")
