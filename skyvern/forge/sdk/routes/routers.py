from fastapi import APIRouter

base_router = APIRouter()
legacy_base_router = APIRouter(include_in_schema=False)
legacy_v2_router = APIRouter(include_in_schema=False)

# Ensure route modules register their endpoints with the routers above
try:
    from . import auth  # noqa: F401
except Exception:
    # Routes are best-effort; avoid import-time crashes
    pass
