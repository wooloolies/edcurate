"""remove topic from classroom presets

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-06 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "bcddadb2147a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("classroom_presets", "topic")


def downgrade() -> None:
    op.add_column(
        "classroom_presets",
        sa.Column("topic", sa.String(length=500), nullable=True),
    )
