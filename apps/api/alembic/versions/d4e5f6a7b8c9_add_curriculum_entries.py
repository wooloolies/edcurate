"""add curriculum entries

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-06 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import column, table

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "c3d4e5f6a7b8"
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
    op.create_table(
        "curriculum_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("country_code", sa.String(length=5), nullable=False),
        sa.Column("country_name", sa.String(length=100), nullable=False),
        sa.Column("subject", sa.String(length=100), nullable=False),
        sa.Column("framework", sa.String(length=255), nullable=False),
        sa.Column("grade", sa.String(length=50), nullable=False),
        sa.Column("grade_sort", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_curriculum_entries")),
        sa.UniqueConstraint(
            "country_code",
            "subject",
            "framework",
            "grade",
            name=op.f("uq_curriculum_entries_country_subject_framework_grade"),
        ),
    )
    op.create_index(
        op.f("ix_curriculum_entries_country_code"),
        "curriculum_entries",
        ["country_code"],
    )

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

    au_foundation_to_12 = [("Foundation", 0)] + [(f"Year {i}", i) for i in range(1, 13)]
    au_foundation_to_10 = [("Foundation", 0)] + [(f"Year {i}", i) for i in range(1, 11)]

    us_math_grades = [
        ("Kindergarten", 0),
        ("First grade", 1),
        ("Second grade", 2),
        ("Third grade", 3),
        ("Fourth grade", 4),
        ("Fifth grade", 5),
        ("Sixth grade", 6),
        ("Seventh grade", 7),
        ("Eighth grade", 8),
        ("High school", 9),
    ]
    us_ela_grades = [
        ("Kindergarten", 0),
        ("First grade", 1),
        ("Second grade", 2),
        ("Third grade", 3),
        ("Fourth grade", 4),
        ("Fifth grade", 5),
        ("Sixth grade", 6),
        ("Seventh grade", 7),
        ("Eighth grade", 8),
        ("Ninth grade", 9),
        ("Tenth grade", 10),
        ("Eleventh grade", 11),
        ("Twelfth grade", 12),
    ]
    us_science_grades = [
        ("Kindergarten", 0),
        ("First grade", 1),
        ("Second grade", 2),
        ("Third grade", 3),
        ("Fourth grade", 4),
        ("Fifth grade", 5),
        ("Sixth grade", 6),
        ("Seventh grade", 7),
        ("Eighth grade", 8),
        ("Biology", 9),
        ("Chemistry", 10),
        ("Physics", 11),
    ]
    us_ss_grades = [
        ("Kindergarten", 0),
        ("First grade", 1),
        ("Second grade", 2),
        ("Third grade", 3),
        ("Fourth grade", 4),
        ("Fifth grade", 5),
        ("Sixth grade", 6),
        ("Seventh grade", 7),
        ("Eighth grade", 8),
        ("U.S. History", 9),
        ("Civics & government", 10),
    ]

    uk_england_years = [(f"Year {i}", i - 1) for i in range(1, 12)]
    uk_scotland_grades = [(f"Primary {i}", i - 1) for i in range(1, 8)] + [
        (f"Secondary {i}", 6 + i) for i in range(1, 4)
    ]

    ca_ontario_grades = [("Kindergarten", 0)] + [
        (f"Grade {i}", i) for i in range(1, 13)
    ]
    ca_bc_grades = [("Kindergarten", 0)] + [(f"Grade {i}", i) for i in range(1, 13)]
    ca_ontario_science = [("Kindergarten", 0)] + [
        (f"Grade {i}", i) for i in range(1, 11)
    ]

    in_grades = [("Lower kindergarten", 0), ("Upper kindergarten", 1)] + [
        (f"Class {n}", i)
        for i, n in enumerate(
            ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"],
            start=2,
        )
    ]

    nz_grades = [(f"Year {i}", i - 1) for i in range(1, 14)]

    za_grades = [("Reception", 0)] + [(f"Grade {i}", i) for i in range(1, 13)]

    rows: list[dict] = []

    # Australia
    rows += _make_rows(
        "AU",
        "Australia",
        "Maths",
        "Australian Curriculum, version 9.0",
        au_foundation_to_12,
    )
    rows += _make_rows(
        "AU",
        "Australia",
        "English",
        "Australian Curriculum, version 9.0",
        au_foundation_to_12,
    )
    rows += _make_rows(
        "AU",
        "Australia",
        "Science",
        "Australian Curriculum, version 9.0",
        au_foundation_to_10,
    )

    # United States
    rows += _make_rows(
        "US", "United States", "Math", "Common Core State Standards", us_math_grades
    )
    rows += _make_rows(
        "US",
        "United States",
        "Language Arts",
        "Common Core State Standards",
        us_ela_grades,
    )
    rows += _make_rows(
        "US",
        "United States",
        "Science",
        "Next Generation Science Standards",
        us_science_grades,
    )
    rows += _make_rows(
        "US",
        "United States",
        "Social Studies",
        "College, Career, and Civic Life (C3) Framework",
        us_ss_grades,
    )

    # United Kingdom
    rows += _make_rows(
        "UK", "United Kingdom", "Maths", "England: Programme of Study", uk_england_years
    )
    rows += _make_rows(
        "UK",
        "United Kingdom",
        "Maths",
        "Scotland: Curriculum for Excellence Benchmarks",
        uk_scotland_grades,
    )
    rows += _make_rows(
        "UK",
        "United Kingdom",
        "English",
        "England: Programme of Study",
        uk_england_years,
    )
    rows += _make_rows(
        "UK",
        "United Kingdom",
        "English",
        "Scotland: Curriculum for Excellence Benchmarks",
        uk_scotland_grades,
    )
    rows += _make_rows(
        "UK",
        "United Kingdom",
        "Science",
        "England: Programme of Study",
        uk_england_years,
    )

    # Canada
    rows += _make_rows("CA", "Canada", "Math", "Ontario Curriculum", ca_ontario_grades)
    rows += _make_rows(
        "CA", "Canada", "Math", "British Columbia Learning Standards", ca_bc_grades
    )
    rows += _make_rows(
        "CA", "Canada", "English Language Arts", "Ontario Curriculum", ca_ontario_grades
    )
    rows += _make_rows(
        "CA", "Canada", "Science", "Ontario Curriculum", ca_ontario_science
    )

    # India
    rows += _make_rows("IN", "India", "Maths", "NCERT Syllabus", in_grades)
    rows += _make_rows("IN", "India", "English", "NCERT Syllabus", in_grades)

    # New Zealand
    rows += _make_rows(
        "NZ", "New Zealand", "Maths", "New Zealand Curriculum", nz_grades
    )
    rows += _make_rows(
        "NZ", "New Zealand", "English", "New Zealand Curriculum", nz_grades
    )

    # South Africa
    rows += _make_rows(
        "ZA", "South Africa", "Maths", "National Curriculum Statement (CAPS)", za_grades
    )
    rows += _make_rows(
        "ZA", "South Africa", "English", "National Curriculum Statement", za_grades
    )

    # Ireland
    ie_primary_maths = [
        ("Junior infants", 0),
        ("Senior infants", 1),
        ("First class", 2),
        ("Second class", 3),
        ("Third class", 4),
        ("Fourth class", 5),
        ("Fifth class", 6),
        ("Sixth class", 7),
    ]
    ie_jc_maths = [
        ("First year", 0),
        ("Second year", 1),
        ("Third year", 2),
    ]
    ie_lc_maths = [
        ("Transition year", 0),
        ("Fifth year", 1),
        ("Sixth year", 2),
    ]
    ie_primary_english = [
        ("Senior infants", 0),
        ("First class", 1),
        ("Second class", 2),
        ("Third class", 3),
        ("Fourth class", 4),
        ("Fifth class", 5),
        ("Sixth class", 6),
    ]
    rows += _make_rows(
        "IE", "Ireland", "Maths", "Primary Mathematics Curriculum", ie_primary_maths
    )
    rows += _make_rows(
        "IE", "Ireland", "Maths", "Junior Certificate Syllabus", ie_jc_maths
    )
    rows += _make_rows(
        "IE", "Ireland", "Maths", "Leaving Certificate Syllabus", ie_lc_maths
    )
    rows += _make_rows(
        "IE",
        "Ireland",
        "English",
        "Primary School Curriculum Standards",
        ie_primary_english,
    )

    # France
    fr_grades = [
        ("GS", 0),
        ("CP", 1),
        ("CE1", 2),
        ("CE2", 3),
        ("CM1", 4),
        ("CM2", 5),
        ("6e", 6),
    ]
    rows += _make_rows(
        "FR",
        "France",
        "Maths",
        "Programme officiel de l'Éducation nationale",
        fr_grades,
    )

    # Brasil
    br_grades = [
        ("Pré-escola", 0),
        ("1º ano", 1),
        ("2º ano", 2),
        ("3º ano", 3),
        ("4º ano", 4),
        ("5º ano", 5),
        ("6º ano", 6),
    ]
    rows += _make_rows("BR", "Brasil", "Math", "IXL Math Curriculum", br_grades)

    # España
    es_grades = [
        ("Infantil", 0),
        ("1.º de primaria", 1),
        ("2.º de primaria", 2),
        ("3.º de primaria", 3),
        ("4.º de primaria", 4),
        ("5.º de primaria", 5),
        ("6.º de primaria", 6),
    ]
    rows += _make_rows("ES", "España", "Math", "IXL Math Curriculum", es_grades)

    # Latinoamérica
    la_grades = [
        ("Preescolar", 0),
        ("1.er grado", 1),
        ("2.º grado", 2),
        ("3.er grado", 3),
        ("4.º grado", 4),
        ("5.º grado", 5),
        ("6.º grado", 6),
        ("7.º grado", 7),
        ("8.º grado", 8),
    ]
    rows += _make_rows("LA", "Latinoamérica", "Math", "IXL Math Curriculum", la_grades)

    op.bulk_insert(curriculum_entries_table, rows)


def downgrade() -> None:
    op.drop_index(
        op.f("ix_curriculum_entries_country_code"),
        table_name="curriculum_entries",
    )
    op.drop_table("curriculum_entries")
