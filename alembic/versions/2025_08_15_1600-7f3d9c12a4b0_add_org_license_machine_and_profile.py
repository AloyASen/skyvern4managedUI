"""Add organization license, machine, and profile tables

Revision ID: 7f3d9c12a4b0
Revises: 0d8bdb45b4c3
Create Date: 2025-08-15 16:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7f3d9c12a4b0"
down_revision: Union[str, None] = "0d8bdb45b4c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_licenses",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.organization_id"), nullable=False),
        sa.Column("license_key_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(op.f("ix_organization_licenses_organization_id"), "organization_licenses", ["organization_id"], unique=False)
    op.create_index(op.f("ix_organization_licenses_license_key_hash"), "organization_licenses", ["license_key_hash"], unique=True)

    op.create_table(
        "organization_machines",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("license_id", sa.String(), sa.ForeignKey("organization_licenses.id"), nullable=False),
        sa.Column("machine_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("license_id", "machine_id", name="uq_license_machine"),
    )
    op.create_index(op.f("ix_organization_machines_license_id"), "organization_machines", ["license_id"], unique=False)

    op.create_table(
        "organization_profiles",
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.organization_id"), primary_key=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("license_type", sa.String(), nullable=True),
        sa.Column("market", sa.String(), nullable=True),
        sa.Column("plan", sa.String(), nullable=True),
        sa.Column("franchise_name", sa.String(), nullable=True),
        sa.Column("partner_name", sa.String(), nullable=True),
        sa.Column("days_left", sa.Integer(), nullable=True),
        sa.Column("valid", sa.Boolean(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("organization_profiles")
    op.drop_index(op.f("ix_organization_machines_license_id"), table_name="organization_machines")
    op.drop_table("organization_machines")
    op.drop_index(op.f("ix_organization_licenses_license_key_hash"), table_name="organization_licenses")
    op.drop_index(op.f("ix_organization_licenses_organization_id"), table_name="organization_licenses")
    op.drop_table("organization_licenses")

