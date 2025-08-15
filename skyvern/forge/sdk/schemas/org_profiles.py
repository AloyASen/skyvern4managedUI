from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrganizationProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organization_id: str
    name: str | None = None
    email: str | None = None
    license_type: str | None = None
    market: str | None = None
    plan: str | None = None
    franchise_name: str | None = None
    partner_name: str | None = None
    days_left: int | None = None
    valid: bool | None = None
    updated_at: datetime

