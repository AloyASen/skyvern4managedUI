Organizations persistence in Postgres

- Overview: Organizations, license associations, machines, and profile snapshots are now stored in Postgres instead of `.streamlit/organizations.json`.

- Tables:
  - `organizations`: Existing table; stores core org metadata.
  - `organization_licenses`: Maps a unique `license_key_hash` (SHA-256) to a single `organization_id`.
  - `organization_machines`: Associates `machine_id` values to a license via `license_id` with a unique constraint on `(license_id, machine_id)`.
  - `organization_profiles`: Stores the current profile for an organization (name, email, license_type, market, plan, franchise_name, partner_name, days_left, valid).

- Normalization (1NF→5NF):
  - 1NF: Each column holds atomic values; repeated structures are decomposed (machines split from licenses; user details into scalar columns).
  - 2NF/3NF: Non-key attributes depend on the whole key without transitive dependencies (e.g., profile attributes depend on `organization_id`; machines depend on `(license_id, machine_id)`).
  - BCNF/4NF: No non-trivial functional dependencies beyond candidate keys; multivalued dependency of machines on licenses isolated in `organization_machines`.
  - 5NF: Join dependencies are preserved through decomposition: org ←→ licenses ←→ machines form lossless joins without redundancy; profile depends solely on org.

- Security:
  - License keys are never stored in plaintext; only a SHA-256 hex `license_key_hash` is persisted.
  - Logs mask license values; only hashes and machine IDs are recorded in DB.
  - Secrets elsewhere in the system (passwords, cards) are encrypted at rest with AES‑GCM. See `docs/CREDENTIALS_DB.md`.

- API behavior changes:
  - `POST /auth/login`: On successful license validation, the service persists the org-license mapping, machine association, and current profile snapshot.
  - `GET /auth/profile`: Reads from `organization_profiles` by `X-Organization-ID` header and returns `{ name, email, licenseType, market, plan }`.

- Migration:
  - New Alembic revision `7f3d9c12a4b0` adds the three tables.
  - Run `alembic upgrade head` (or the project’s migration script) after updating code.

- Environment variables:
  - `PRODUCT_ID`: Required for license server request.
  - `LICENSE_SERVER_URL` or `VITE_LICENSE_SERVER_URL`: Base URL for license validation.
  - Optional `LICENSE_LOGIN_PATH` to override the login path.

- Operational notes:
  - Existing organizations continue to be created via `get_or_create_user_org()` using a stable user_id derived from the license key.
  - A first successful login creates rows in `organization_licenses` and `organization_machines`, plus the org profile snapshot.
  - Re-logins update the profile row in place and insert missing machine associations if new.
