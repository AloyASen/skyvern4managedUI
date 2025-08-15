Credentials in Postgres

- Overview: Credentials (passwords and credit cards) are now stored in Postgres for each organization. External password managers (Bitwarden/1Password) are no longer used for creation, storage, retrieval, or selection in the UI.

- Tables:
  - `credentials`: Metadata per credential: `credential_id` (PK), `organization_id`, `name`, `credential_type` (password|credit_card), timestamps.
  - `credential_passwords`: One-to-one with `credentials` when type is password: `credential_id` (PK), `username`, `password`, `totp`, timestamps.
  - `credential_credit_cards`: One-to-one with `credentials` when type is credit_card: `credential_id` (PK), `card_number`, `card_cvv`, `card_exp_month`, `card_exp_year`, `card_brand`, `card_holder_name`, timestamps.

- Normalization (1NF→5NF):
  - 1NF: Atomic columns; no repeating groups; secrets split per type.
  - 2NF/3NF: Non-key attributes fully depend on their keys with no transitive dependencies. Secret attributes depend on `credential_id` only; org data is in `credentials`.
  - 4NF/5NF: Multivalued dependencies (e.g., different secret shapes for different types) decomposed into separate relations; joins are lossless: `credentials` ←→ `credential_passwords`/`credential_credit_cards`.

- API
  - `POST /v1/credentials`: Creates the credential and persists the appropriate secret table. Response masks sensitive data (username only for passwords; last four + brand for cards).
  - `GET /v1/credentials`: Lists credentials for the current org with masked info suitable for dropdowns.
  - `GET /v1/credentials/{id}`: Returns a single credential with masked info.
  - `POST /v1/credentials/{id}/delete`: Soft-deletes the credential and removes secret rows.

- UI
  - Dashboard → Credentials: Add Password or Credit Card opens a modal; on save, data is stored in Postgres.
  - Workflow → Parameters → Credential: Only “Skyvern” is available. The dropdown lists credentials for the connected org and includes an “Add new credential” option that opens the same modal.

- Security
  - API responses never include raw secrets.
  - Encryption at rest: All secret fields are encrypted using AES‑GCM with a key derived from `SECRET_KEY`.
    - Algorithm: AES‑GCM (12‑byte random nonce per record, 16‑byte tag)
    - Key: `SHA256(SECRET_KEY)` → 32‑byte key
    - Format: Stored as `v1:<nonce_b64>:<ciphertext_b64>` strings
    - Code: `skyvern/forge/sdk/utils/crypto.py` (`encrypt_str`, `decrypt_str`)
    - Rotation: bump format version and add a re-encryption migration if needed

- Migration
  - Apply Alembic revisions `aa21b4c0d5f1` (credential secret tables). Run `alembic upgrade head`.
  - External providers removed: `d49e4b8a5f3c` drops legacy Bitwarden/1Password tables. This is a breaking change for any existing data in those tables. Backup before upgrading if needed.

## End‑to‑End Examples

- Add a password credential via API
  - Request: `POST /v1/credentials`
    - Body: `{ "name": "my_login", "credential_type": "password", "credential": { "username":"u", "password":"p", "totp": null } }`
  - Result: Metadata row in `credentials`; encrypted fields in `credential_passwords`.

- Add a credit card via API
  - Request: `POST /v1/credentials` with `credential_type: "credit_card"` and full card fields
  - Result: Metadata row + encrypted fields in `credential_credit_cards`.

- Add a credential in the UI
  - Dashboard → Credentials → Add → choose Password or Credit Card → Save
  - The modal calls the same API; secrets are encrypted and stored in Postgres.

- Use a credential in a workflow
  - Workflow editor → Parameters → Add → Credential
  - The dropdown lists org credentials; pick one or “Add new credential” to open the modal
  - At runtime, the agent decrypts fields and injects them as obfuscated values for safe use during execution
