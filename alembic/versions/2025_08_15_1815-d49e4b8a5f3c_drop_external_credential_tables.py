"""Drop Bitwarden/1Password tables (deprecated)

Revision ID: d49e4b8a5f3c
Revises: aa21b4c0d5f1
Create Date: 2025-08-15 18:15:00.000000

Notes:
    This migration permanently removes legacy tables related to Bitwarden and 1Password integrations.
    Skyvern now stores credentials solely in Postgres (see CREDENTIALS_DB.md). This is a breaking change
    for any environments relying on those tables.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d49e4b8a5f3c"
down_revision: Union[str, None] = "aa21b4c0d5f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop external provider parameter tables
    for table in [
        "bitwarden_login_credential_parameters",
        "bitwarden_sensitive_information_parameters",
        "bitwarden_credit_card_data_parameters",
        "onepassword_credential_parameters",
        "organization_bitwarden_collections",
    ]:
        try:
            op.drop_table(table)
        except Exception:
            # Table may not exist in some environments
            pass


def downgrade() -> None:
    # Recreate minimal table structures for downgrade only (without constraints/indexes)
    op.create_table(
        "organization_bitwarden_collections",
        sa.Column("organization_bitwarden_collection_id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), nullable=False),
        sa.Column("collection_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "bitwarden_login_credential_parameters",
        sa.Column("bitwarden_login_credential_parameter_id", sa.String(), primary_key=True),
        sa.Column("workflow_id", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("bitwarden_client_id_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_client_secret_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_master_password_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_collection_id", sa.String(), nullable=True),
        sa.Column("bitwarden_item_id", sa.String(), nullable=True),
        sa.Column("url_parameter_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "bitwarden_sensitive_information_parameters",
        sa.Column("bitwarden_sensitive_information_parameter_id", sa.String(), primary_key=True),
        sa.Column("workflow_id", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("bitwarden_client_id_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_client_secret_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_master_password_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_collection_id", sa.String(), nullable=False),
        sa.Column("bitwarden_identity_key", sa.String(), nullable=False),
        sa.Column("bitwarden_identity_fields", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "bitwarden_credit_card_data_parameters",
        sa.Column("bitwarden_credit_card_data_parameter_id", sa.String(), primary_key=True),
        sa.Column("workflow_id", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("bitwarden_client_id_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_client_secret_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_master_password_aws_secret_key", sa.String(), nullable=False),
        sa.Column("bitwarden_collection_id", sa.String(), nullable=False),
        sa.Column("bitwarden_item_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "onepassword_credential_parameters",
        sa.Column("onepassword_credential_parameter_id", sa.String(), primary_key=True),
        sa.Column("workflow_id", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("vault_id", sa.String(), nullable=False),
        sa.Column("item_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )

