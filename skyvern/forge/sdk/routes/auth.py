from datetime import datetime, timedelta
from hashlib import sha256

import httpx
from fastapi import HTTPException, status
from jose import jwt
from pydantic import BaseModel, ConfigDict, Field

from skyvern.config import settings
from skyvern.forge import app
from skyvern.forge.sdk.routes.routers import base_router
from skyvern.utils.fingerprint import SYSTEM_FINGERPRINT


class LicenseLoginRequest(BaseModel):
    """Request body containing a license key."""

    license_key: str


class TokenResponse(BaseModel):
    """Response containing a JWT access token and organization mapping."""

    model_config = ConfigDict(populate_by_name=True)

    access_token: str
    organization_id: str = Field(alias="organizationID")
    token_type: str = "bearer"


@base_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LicenseLoginRequest) -> TokenResponse:
    """Validate a license key and issue an access token."""
    username: str
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
    else:
        try:
            response = httpx.post(
                f"{settings.LICENSE_SERVER_URL}/api/license/validate",
                json={
                    "licenseKey": data.license_key,
                    "machineId": SYSTEM_FINGERPRINT,
                    "productId": 1,
                },
                timeout=10.0,
            )
            payload = response.json()
        except Exception as exc:  # pragma: no cover - network error
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
        if str(payload.get("valid")).lower() != "true":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid license")
        username = payload["user"]["email"]
        hashed = sha256(data.license_key.encode()).hexdigest()
        if not await app.DATABASE.get_user(username):
            await app.DATABASE.create_user(username, hashed)
    org = await app.DATABASE.get_or_create_user_org(username)
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": username, "exp": expire}, settings.SECRET_KEY, algorithm=settings.SIGNATURE_ALGORITHM
    )
    return TokenResponse(access_token=token, organization_id=org.organization_id)
