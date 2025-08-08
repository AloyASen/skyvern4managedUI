import sys
import types
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine

# Create a lightweight stub for the top-level skyvern package to avoid heavy imports
skyvern_stub = types.ModuleType("skyvern")
skyvern_stub.__path__ = [str(Path(__file__).resolve().parents[2] / "skyvern")]
sys.modules["skyvern"] = skyvern_stub
forge_stub = types.ModuleType("skyvern.forge")
app_stub = types.ModuleType("skyvern.forge.app")
forge_stub.app = app_stub
forge_stub.__path__ = [str(Path(__file__).resolve().parents[2] / "skyvern/forge")]
sys.modules["skyvern.forge"] = forge_stub
sys.modules["skyvern.forge.app"] = app_stub

openai_stub = types.ModuleType("openai")
openai_types_stub = types.ModuleType("openai.types")
openai_responses_stub = types.ModuleType("openai.types.responses")
openai_response_stub = types.ModuleType("openai.types.responses.response")
openai_response_stub.Response = object
sys.modules["openai"] = openai_stub
sys.modules["openai.types"] = openai_types_stub
sys.modules["openai.types.responses"] = openai_responses_stub
sys.modules["openai.types.responses.response"] = openai_response_stub
class _OpenAIClient:
    pass
openai_stub.AsyncOpenAI = _OpenAIClient
openai_stub.AsyncAzureOpenAI = _OpenAIClient

anthropic_stub = types.ModuleType("anthropic")
class _AnthropicAsync:
    pass

anthropic_stub.AsyncAnthropic = _AnthropicAsync
anthropic_stub.AsyncAnthropicBedrock = _AnthropicAsync
sys.modules["anthropic"] = anthropic_stub

playwright_stub = types.ModuleType("playwright")
impl_stub = types.ModuleType("playwright._impl")
errors_stub = types.ModuleType("playwright._impl._errors")
class TargetClosedError(Exception):
    pass
errors_stub.TargetClosedError = TargetClosedError
class TimeoutError(Exception):
    pass
errors_stub.TimeoutError = TimeoutError
sys.modules["playwright"] = playwright_stub
sys.modules["playwright._impl"] = impl_stub
sys.modules["playwright._impl._errors"] = errors_stub
async_api_stub = types.ModuleType("playwright.async_api")
class Page:
    pass
async_api_stub.Page = Page
class ElementHandle:
    pass
async_api_stub.ElementHandle = ElementHandle
class Frame:
    pass
async_api_stub.Frame = Frame
class Locator:
    pass
async_api_stub.Locator = Locator
sys.modules["playwright.async_api"] = async_api_stub

alembic_stub = types.ModuleType("alembic")
command_stub = types.ModuleType("alembic.command")
sys.modules["alembic"] = alembic_stub
sys.modules["alembic.command"] = command_stub
config_stub = types.ModuleType("alembic.config")
class Config:
    pass
config_stub.Config = Config
sys.modules["alembic.config"] = config_stub

litellm_stub = types.ModuleType("litellm")
class _ConfigDict(dict):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

litellm_stub.ConfigDict = _ConfigDict
sys.modules["litellm"] = litellm_stub

from skyvern.forge import app as app_module
from skyvern.forge.sdk.db.client import AgentDB
from skyvern.forge.sdk.db.models import Base
from skyvern.forge.sdk.routes import auth as _  # noqa: F401
from skyvern.forge.sdk.routes.routers import base_router


@pytest.mark.asyncio
async def test_get_or_create_user_org_roundtrip() -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    db = AgentDB("sqlite+aiosqlite:///:memory:", db_engine=engine)
    first = await db.get_or_create_user_org("bob")
    second = await db.get_or_create_user_org("bob")
    assert first.organization_id == second.organization_id


@pytest.mark.asyncio
async def test_get_or_create_user_org_sequential() -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    db = AgentDB("sqlite+aiosqlite:///:memory:", db_engine=engine)
    first = await db.get_or_create_user_org("alice")
    second = await db.get_or_create_user_org("charlie")
    assert first.organization_id != second.organization_id
    assert first.organization_name == "organization-1"
    assert second.organization_name == "organization-2"


def test_license_login(monkeypatch) -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    import asyncio

    asyncio.get_event_loop().run_until_complete(setup())

    db = AgentDB("sqlite+aiosqlite:///:memory:", db_engine=engine)
    app_module.DATABASE = db

    fastapi_app = FastAPI()
    fastapi_app.include_router(base_router)
    client = TestClient(fastapi_app)

    import httpx

    def fake_post(url, json, timeout=10.0):
        class Resp:
            def json(self):
                return {
                    "valid": "True",
                    "user": {"email": "alice@example.com", "name": "Alice"},
                }

        return Resp()

    monkeypatch.setattr(httpx, "post", fake_post)

    resp = client.post("/auth/login", json={"license_key": "abc"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["organizationID"] == "organization-1"

    resp2 = client.post("/auth/login", json={"license_key": "abc"})
    assert resp2.status_code == 200
    assert resp2.json()["organizationID"] == body["organizationID"]
