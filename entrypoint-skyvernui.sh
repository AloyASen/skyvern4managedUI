#!/usr/bin/env bash

set -euo pipefail

# Set API key from secrets, if not already provided
if [[ -z "${VITE_SKYVERN_API_KEY:-}" ]] && [[ -f "/app/.streamlit/secrets.toml" ]]; then
  VITE_SKYVERN_API_KEY=$(sed -n 's/.*cred\s*=\s*"\([^"]*\)".*/\1/p' /app/.streamlit/secrets.toml)
  export VITE_SKYVERN_API_KEY
fi

# Compute system fingerprint for license validation (best-effort)
if [[ -z "${VITE_SYSTEM_FINGERPRINT:-}" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    VITE_SYSTEM_FINGERPRINT=$(python3 - <<'PY'
from skyvern.utils.fingerprint import SYSTEM_FINGERPRINT
print(SYSTEM_FINGERPRINT)
PY
)
  else
    if [[ -f /etc/machine-id ]]; then
      VITE_SYSTEM_FINGERPRINT=$(cat /etc/machine-id)
    else
      VITE_SYSTEM_FINGERPRINT=$(hostname)
    fi
  fi
  export VITE_SYSTEM_FINGERPRINT
fi

# Start the UI (Vite preview + artifact server)
npm run start
