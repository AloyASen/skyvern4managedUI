"""Backfill item_id in credentials table

Revision ID: b0f1a2c3d4e5
Revises: d49e4b8a5f3c
Create Date: 2025-08-16 09:00:00

Populates missing item_id values with UUID4 strings for legacy
credential rows to satisfy schema validation and API responses.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "b0f1a2c3d4e5"
down_revision: Union[str, None] = "d49e4b8a5f3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from uuid import uuid4

    bind = op.get_bind()
    # Find credentials with NULL item_id
    missing = bind.execute(sa.text("SELECT credential_id FROM credentials WHERE item_id IS NULL")).fetchall()
    for (credential_id,) in missing:
        bind.execute(
            sa.text("UPDATE credentials SET item_id = :item_id WHERE credential_id = :credential_id"),
            {"item_id": str(uuid4()), "credential_id": credential_id},
        )


def downgrade() -> None:
    # No-op downgrade: retains populated item_id values.
    pass

