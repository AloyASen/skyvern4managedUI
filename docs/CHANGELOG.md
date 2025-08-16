Skyvern Forge SDK – Recent Changes

Date: 2025-08-16

- Credentials: Server-side item_id generation
  - Added a small service at `skyvern/forge/sdk/services/credential/__init__.py` that generates a UUID4 `item_id` internally when creating credentials. The frontend payloads remain unchanged.
  - Route `POST /credentials` updated to call this service instead of invoking the DB client directly.

- DB: `AgentDB.create_credential` accepts optional item_id
  - Signature: `create_credential(name, credential_type, organization_id, *, item_id: str | None = None)`.
  - If `item_id` is omitted, a UUID4 is generated inside the method.
  - Ensures returned `Credential` always validates (non-null `item_id`).

- Backfill for legacy rows with null item_id
  - `AgentDB.get_credential` and `AgentDB.get_credentials` now detect `item_id=None` and assign a UUID4 on read, persisting the change before schema validation.
  - Prevents Pydantic validation errors when listing or retrieving credentials created prior to this change.
  - Added Alembic migration `2025_08_16_0900-b0f1a2c3d4e5_backfill_item_id_in_credentials.py` to proactively populate `item_id` for all existing rows.

- Schemas and imports
  - Added shim module `skyvern/forge/sdk/schemas/credential.py` re-exporting types from `schemas/credentials.py` to support a singular import path.
  - `routes/credentials.py` switched imports to the shim and now uses the new credential service for creation.

- No frontend changes required
  - UI continues to post the same payload. Backend injects `item_id` and persists secrets as before.

Impact
- Fixes “item_id must be a valid string” validation errors on credential creation and listing.
- Backfills legacy data automatically; optional one-time migration can be added if desired for bulk backfill.
