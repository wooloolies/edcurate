"""add classroom presets

Revision ID: a1b2c3d4e5f6
Revises: fcaa9d268d97
Create Date: 2026-04-04 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "fcaa9d268d97"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "classroom_presets",
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "is_default",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("curriculum_framework", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("year_level", sa.String(length=50), nullable=False),
        sa.Column("topic", sa.String(length=500), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("state_region", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column(
            "teaching_language",
            sa.String(length=10),
            server_default="en",
            nullable=False,
        ),
        sa.Column("class_size", sa.Integer(), nullable=True),
        sa.Column("eal_d_students", sa.Integer(), nullable=True),
        sa.Column("reading_support_students", sa.Integer(), nullable=True),
        sa.Column("extension_students", sa.Integer(), nullable=True),
        sa.Column("student_interests", JSONB(), server_default="[]", nullable=True),
        sa.Column("language_backgrounds", JSONB(), server_default="[]", nullable=True),
        sa.Column("average_reading_level", sa.String(length=50), nullable=True),
        sa.Column(
            "source_weights",
            JSONB(),
            server_default='{"ddgs": 0.34, "youtube": 0.33, "openalex": 0.33}',
            nullable=False,
        ),
        sa.Column("additional_notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_classroom_presets")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_classroom_presets_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "class_size IS NULL OR class_size > 0",
            name=op.f("ck_classroom_presets_class_size"),
        ),
        sa.CheckConstraint(
            "eal_d_students IS NULL OR eal_d_students >= 0",
            name=op.f("ck_classroom_presets_eal_d"),
        ),
        sa.CheckConstraint(
            "reading_support_students IS NULL OR reading_support_students >= 0",
            name=op.f("ck_classroom_presets_reading_support"),
        ),
        sa.CheckConstraint(
            "extension_students IS NULL OR extension_students >= 0",
            name=op.f("ck_classroom_presets_extension"),
        ),
        sa.CheckConstraint(
            "(source_weights->>'ddgs')::numeric BETWEEN 0 AND 1 AND "
            "(source_weights->>'youtube')::numeric BETWEEN 0 AND 1 AND "
            "(source_weights->>'openalex')::numeric BETWEEN 0 AND 1",
            name=op.f("ck_classroom_presets_source_weights_range"),
        ),
        sa.CheckConstraint(
            "ABS("
            "COALESCE((source_weights->>'ddgs')::numeric, 0) + "
            "COALESCE((source_weights->>'youtube')::numeric, 0) + "
            "COALESCE((source_weights->>'openalex')::numeric, 0) - 1.0"
            ") <= 0.01",
            name=op.f("ck_classroom_presets_source_weights_sum"),
        ),
    )
    op.create_index(
        "ix_classroom_presets_user_id",
        "classroom_presets",
        ["user_id"],
    )
    op.create_index(
        "uq_classroom_presets_user_default",
        "classroom_presets",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_classroom_presets_user_default",
        table_name="classroom_presets",
    )
    op.drop_index(
        "ix_classroom_presets_user_id",
        table_name="classroom_presets",
    )
    op.drop_table("classroom_presets")
