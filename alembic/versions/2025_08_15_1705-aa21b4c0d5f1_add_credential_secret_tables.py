"""Add credential secret tables for passwords and credit cards

Revision ID: aa21b4c0d5f1
Revises: 7f3d9c12a4b0
Create Date: 2025-08-15 17:05:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "aa21b4c0d5f1"
down_revision: Union[str, None] = "7f3d9c12a4b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "credential_passwords",
        sa.Column("credential_id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("totp", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "credential_credit_cards",
        sa.Column("credential_id", sa.String(), primary_key=True),
        sa.Column("card_number", sa.String(), nullable=False),
        sa.Column("card_cvv", sa.String(), nullable=False),
        sa.Column("card_exp_month", sa.String(), nullable=False),
        sa.Column("card_exp_year", sa.String(), nullable=False),
        sa.Column("card_brand", sa.String(), nullable=False),
        sa.Column("card_holder_name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("credential_credit_cards")
    op.drop_table("credential_passwords")

