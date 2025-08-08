"""Add user-client mapping table and user_id columns to workflows and workflow_runs

Revision ID: 3f5b4e6a9c2d
Revises: 1eedd7a957d1
Create Date: 2025-08-02 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3f5b4e6a9c2d"
down_revision: Union[str, None] = "1eedd7a957d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create user_clients table and add user_id columns."""
    op.create_table(
        "user_clients",
        sa.Column("user_id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.organization_id"), nullable=False),
    )
    op.create_index(op.f("ix_user_clients_organization_id"), "user_clients", ["organization_id"], unique=False)

    op.add_column("workflows", sa.Column("user_id", sa.String(), nullable=True))
    op.create_index(op.f("ix_workflows_user_id"), "workflows", ["user_id"], unique=False)

    op.add_column("workflow_runs", sa.Column("user_id", sa.String(), nullable=True))
    op.create_index(op.f("ix_workflow_runs_user_id"), "workflow_runs", ["user_id"], unique=False)


def downgrade() -> None:
    """Drop user_clients table and user_id columns."""
    op.drop_index(op.f("ix_workflow_runs_user_id"), table_name="workflow_runs")
    op.drop_column("workflow_runs", "user_id")

    op.drop_index(op.f("ix_workflows_user_id"), table_name="workflows")
    op.drop_column("workflows", "user_id")

    op.drop_index(op.f("ix_user_clients_organization_id"), table_name="user_clients")
    op.drop_table("user_clients")
