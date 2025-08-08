"""add users table

Revision ID: 0d8bdb45b4c3
Revises: 3f5b4e6a9c2d
Create Date: 2025-08-02 12:15:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0d8bdb45b4c3"
down_revision: Union[str, None] = "3f5b4e6a9c2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add users table."""
    op.create_table(
        "users",
        sa.Column("username", sa.String(), primary_key=True),
        sa.Column("password_hash", sa.String(), nullable=False),
    )


def downgrade() -> None:
    """Drop users table."""
    op.drop_table("users")
