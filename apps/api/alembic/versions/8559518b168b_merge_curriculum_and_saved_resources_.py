"""merge curriculum and saved_resources heads

Revision ID: 8559518b168b
Revises: afb2e6fe8ebf, d4e5f6a7b8c9
Create Date: 2026-04-06 23:56:58.657328

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8559518b168b"
down_revision: Union[str, None] = ("afb2e6fe8ebf", "d4e5f6a7b8c9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
