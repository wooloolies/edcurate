"""merge library_collections and generated_artifacts heads

Revision ID: e6f7a8b9c0d1
Revises: 5899875c22d2, c27674d0b6c1
Create Date: 2026-04-08 01:12:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b9c0d1"
down_revision: str | Sequence[str] | None = ("5899875c22d2", "c27674d0b6c1")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
