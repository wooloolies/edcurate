"""add description to library_collections

Revision ID: a2b3c4d5e6f7
Revises: 465be38b13e8, e7f8a9b0c1d2
Create Date: 2026-04-08 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: str | None = ("465be38b13e8", "e7f8a9b0c1d2")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "library_collections",
        sa.Column("description", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("library_collections", "description")
