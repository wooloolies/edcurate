"""merge multiple heads

Revision ID: 465be38b13e8
Revises: 156885046efb, e6f7a8b9c0d1
Create Date: 2026-04-08 03:28:24.836769

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = '465be38b13e8'
down_revision: str | None = ('156885046efb', 'e6f7a8b9c0d1')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
