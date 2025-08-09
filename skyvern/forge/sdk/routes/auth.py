from datetime import datetime, timedelta
from typing import Any
import logging
from hashlib import sha256

import httpx
from fastapi import HTTPException, status
from jose import jwt
from pydantic import BaseModel, ConfigDict, Field

from skyvern.config import settings
from skyvern.forge import app
from skyvern.forge.sdk.routes.routers import base_router, legacy_base_router
from skyvern.utils.fingerprint import SYSTEM_FINGERPRINT


logger = logging.getLogger(__name__)


class LicenseLoginRequest(BaseModel):
    """Request body containing a license key and optional client identifiers."""

    license_key: str
    machine_id: str | None = None
    product_id: int | None = None


class TokenResponse(BaseModel):
    """Response containing a JWT, organization mapping, and license metadata."""

    model_config = ConfigDict(populate_by_name=True)

    access_token: str
    organization_id: str = Field(alias="organizationID")
    token_type: str = "bearer"
    license_valid: bool | None = None
    license_user: dict[str, Any] | None = None
    license_payload: dict[str, Any] | None = None


@base_router.post("/auth/login", response_model=TokenResponse)
@legacy_base_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LicenseLoginRequest) -> TokenResponse:
    """Validate a license key and issue an access token."""
    username: str
    
    # Mask license key for safer logs (show first/last 2 chars)
    def _mask(s: str) -> str:
        return s if len(s) <= 4 else f"{s[:2]}***{s[-2:]}"

    logger.info(
        "[auth.login] inbound: machine_id=%s product_id=%s license_key=%s",
        data.machine_id,
        data.product_id,
        _mask(data.license_key),
    )
    print(
        "[auth.login] inbound:",
        {"machine_id": data.machine_id, "product_id": data.product_id, "license_key": _mask(data.license_key)},
        flush=True,
    )

    license_valid: bool | None = None
    license_user: dict[str, Any] | None = None
    license_payload: dict[str, Any] | None = None

    if (
        settings.INITIAL_USER_USERNAME
        and settings.INITIAL_USER_PASSWORD
        and data.license_key == settings.INITIAL_USER_PASSWORD
    ):
        username = settings.INITIAL_USER_USERNAME
        user = await app.DATABASE.get_user(username)
        if not user:
            hashed = sha256(data.license_key.encode()).hexdigest()
            await app.DATABASE.create_user(username, hashed)
        license_valid = True
        license_user = {"email": username}
    else:
        try:
            url = f"{settings.LICENSE_SERVER_URL}/api/license/validate"
            outbound_payload = {
                "licenseKey": data.license_key,
                "machineId": data.machine_id or SYSTEM_FINGERPRINT,
                "productId": (
                    data.product_id if data.product_id is not None else settings.PRODUCT_ID
                ),
            }
            safe_payload = {**outbound_payload, "licenseKey": _mask(outbound_payload["licenseKey"])}
            logger.info("[auth.login] outbound -> %s payload=%s", url, safe_payload)
            print("[auth.login] outbound ->", url, safe_payload, flush=True)
            response = httpx.post(url, json=outbound_payload, timeout=10.0)
            logger.info("[auth.login] license server response: status=%s", response.status_code)
            print("[auth.login] license server response status:", response.status_code, flush=True)
            payload = response.json()
            logger.info("[auth.login] license server payload keys: %s", list(payload.keys()))
            print("[auth.login] license server payload keys:", list(payload.keys()), flush=True)
            license_payload = payload
        except Exception as exc:  # pragma: no cover - network error
            logger.exception("[auth.login] outbound/license error: %s", exc)
            print("[auth.login] outbound/license error:", str(exc), flush=True)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
        if str(payload.get("valid")).lower() != "true":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid license")
        username = payload["user"]["email"]
        hashed = sha256(data.license_key.encode()).hexdigest()
        if not await app.DATABASE.get_user(username):
            await app.DATABASE.create_user(username, hashed)
        license_valid = True
        license_user = payload.get("user")
    org = await app.DATABASE.get_or_create_user_org(username)
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": username, "exp": expire}, settings.SECRET_KEY, algorithm=settings.SIGNATURE_ALGORITHM
    )
    return TokenResponse(
        access_token=token,
        organization_id=org.organization_id,
        license_valid=license_valid,
        license_user=license_user,
        license_payload=license_payload,
    )
