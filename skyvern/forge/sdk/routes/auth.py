import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
import structlog
from fastapi import Body, Header, HTTPException
from fastapi import status as http_status

from skyvern.forge import app
from skyvern.forge.sdk.services.org_auth_token_service import create_org_api_token
from skyvern.forge.sdk.db.enums import OrganizationAuthTokenType
from skyvern.forge.sdk.core.security import create_access_token

from .routers import legacy_base_router as router


PERSIST_DIR = Path(os.environ.get("PERSIST_DIR", "/app/.streamlit"))
PERSIST_FILE = PERSIST_DIR / "organizations.json"
LOG = structlog.get_logger()


def _load_store() -> Dict[str, Any]:
    try:
        if PERSIST_FILE.exists():
            return json.loads(PERSIST_FILE.read_text())
    except Exception:
        pass
    return {"orgs": {}, "license_to_org": {}}


def _save_store(data: Dict[str, Any]) -> None:
    try:
        PERSIST_DIR.mkdir(parents=True, exist_ok=True)
        PERSIST_FILE.write_text(json.dumps(data, indent=2))
    except Exception as e:
        # Best-effort persistence; do not crash auth
        LOG.warning("auth_persist_failed", error=str(e))


def _org_id_from_license(license_key: str) -> str:
    h = hashlib.sha256(license_key.encode()).hexdigest()[:16]
    return f"org-{h}"


async def _fetch_license_profile(
    license_key: str, machine_id: str, product_id: Optional[str] | Optional[int] = None
) -> Optional[Dict[str, Any]]:
    base = os.environ.get("LICENSE_SERVER_URL") or os.environ.get("VITE_LICENSE_SERVER_URL")
    if not base:
        return None
    # Use configured path if provided; otherwise try a few common paths
    configured_path = os.environ.get("LICENSE_LOGIN_PATH")
    raw_paths = [
        configured_path,
        "/api/license/validate",
        "/api/v1/auth/login",
        "/api/v1/license/login",
        "/api/license/login",
        "/login",
    ]
    # Filter out None/empty and normalize to leading '/'
    paths = []
    for p in raw_paths:
        if not p:
            continue
        p = str(p).strip()
        if not p:
            continue
        if not p.startswith("/"):
            p = "/" + p
        paths.append(p)
    LOG.info(
        "license_paths_prepared",
        base=base,
        configured_path=configured_path,
        paths=paths,
    )
    # Build payload EXACTLY as required by license server
    # {
    #   "licenseKey": "...",
    #   "machineId": "...",
    #   "productId": 2
    # }
    pid: Any = product_id
    try:
        if isinstance(pid, str) and pid.isdigit():
            pid = int(pid)
    except Exception:
        pass
    payload: Dict[str, Any] = {"licenseKey": license_key, "machineId": machine_id}
    if pid is not None:
        payload["productId"] = pid
    async with httpx.AsyncClient(timeout=10) as client:
        for p in paths:
            url = base.rstrip("/") + p
            try:
                # Log where we're calling (mask license)
                def _mask(val: Any) -> Any:
                    try:
                        s = str(val)
                        if len(s) <= 8:
                            return "***"
                        return f"{s[:4]}***{s[-4:]}"
                    except Exception:
                        return "***"

                masked_payload = {
                    "licenseKey": _mask(payload.get("licenseKey")),
                    "machineId": _mask(payload.get("machineId")),
                    "productId": payload.get("productId"),
                }
                LOG.info("license_call_attempt", url=url, payload=masked_payload)
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    LOG.info(
                        "license_call_success",
                        url=url,
                        status=resp.status_code,
                        has_user=isinstance(data, dict) and bool(data.get("user")),
                        valid=data.get("valid") if isinstance(data, dict) else None,
                        days_left=data.get("days_left") if isinstance(data, dict) else None,
                    )
                    return data
                else:
                    body_preview = None
                    try:
                        body_preview = resp.text[:300]
                    except Exception:
                        body_preview = None
                    LOG.warning(
                        "license_call_non_200",
                        url=url,
                        status=resp.status_code,
                        body_preview=body_preview,
                    )
            except Exception:
                LOG.exception("license_call_exception", url=url)
                continue
    return None


@router.post("/auth/login")
async def login(
    body: Dict[str, Any] = Body(...),
):
    license_key = body.get("license_key")
    machine_id = body.get("machine_id")
    if not license_key or not machine_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="license_key and machine_id are required",
        )

    LOG.info(
        "login_request_received",
        licenseKey="***",  # never log raw key
        machineId=(str(machine_id)[:6] + "***") if machine_id else None,
    )
    store = _load_store()
    # Derive a stable user identifier from the license. All devices using the same
    # license are grouped into the same organization.
    user_id = _org_id_from_license(license_key)

    # Always call license server on login: must succeed and must be valid
    product_id = os.environ.get("PRODUCT_ID")
    if not product_id:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PRODUCT_ID is not configured on the server",
        )
    try:
        profile = await _fetch_license_profile(license_key, machine_id, product_id)
    except Exception:
        LOG.exception("license_server_unavailable")
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="License server is unavailable",
        )

    if profile is None:
        # No valid response available from license server
        LOG.error("license_server_no_response")
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="License server is unavailable",
        )

    # Validate license status. Accept boolean or string forms.
    valid_field = profile.get("valid") if isinstance(profile, dict) else None
    is_valid = False
    if isinstance(valid_field, bool):
        is_valid = valid_field
    elif isinstance(valid_field, str):
        is_valid = valid_field.strip().lower() in {"true", "1", "yes", "y"}

    if not is_valid:
        LOG.warning("license_invalid", valid_field=str(valid_field))
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="License is invalid",
        )

    # Create or fetch the user's organization in the database based on the derived user_id
    db_org = await app.DATABASE.get_or_create_user_org(user_id)

    # Persist mapping and the (valid) profile for future reference keyed by DB org id
    org_id = db_org.organization_id
    store.setdefault("orgs", {})[org_id] = {
        "license_key": license_key,
        "machine_id": machine_id,
        "profile": profile,
    }
    store.setdefault("license_to_org", {})[license_key] = org_id
    _save_store(store)
    LOG.info(
        "license_profile_persisted",
        organizationID=org_id,
        has_user=isinstance(profile, dict) and bool(profile.get("user")),
        fields=list(profile.keys()) if isinstance(profile, dict) else None,
    )

    # Ensure an organization API key exists and is persisted (survives restarts)
    try:
        existing = await app.DATABASE.get_valid_org_auth_token(
            org_id, OrganizationAuthTokenType.api
        )
        if not existing:
            await create_org_api_token(org_id)
            LOG.info("org_api_key_created", organizationID=org_id)
    except Exception:
        # Non-fatal: login should still succeed; UI can fetch/generate later if needed
        LOG.exception("org_api_key_create_failed", organizationID=org_id)

    # Mint a JWT compatible with Authorization: Bearer auth used by protected routes
    access_token = create_access_token(subject=user_id)

    # Respond with any known profile details so UI can show immediately
    response: Dict[str, Any] = {
        "access_token": access_token,
        "organizationID": org_id,
    }
    if isinstance(profile, dict):
        # Pass-through selected fields commonly used by the UI
        for key in ("user", "licenseType", "market", "plan", "valid", "days_left"):
            if key in profile:
                response[key] = profile[key]
    return response


@router.get("/auth/profile")
async def get_profile(
    organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
):
    if not organization_id:
        raise HTTPException(status_code=400, detail="X-Organization-ID header is required")
    store = _load_store()
    org = store.get("orgs", {}).get(organization_id)
    if not org:
        return {
            "name": None,
            "email": None,
            "licenseType": None,
            "market": None,
            "plan": None,
        }
    profile = org.get("profile")
    # Normalize a few known shapes
    if isinstance(profile, dict):
        user = profile.get("user") or {}
        return {
            "name": user.get("name") or profile.get("name"),
            "email": user.get("email") or profile.get("email"),
            "licenseType": profile.get("licenseType") or profile.get("license_type"),
            "market": profile.get("market"),
            "plan": profile.get("plan") or (profile.get("license") or {}).get("plan"),
        }
    return {
        "name": None,
        "email": None,
        "licenseType": None,
        "market": None,
        "plan": None,
    }
