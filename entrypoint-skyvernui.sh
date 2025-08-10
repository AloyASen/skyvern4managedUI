#!/usr/bin/env bash

set -euo pipefail

# Set API key from secrets, if not already provided
if [[ -z "${VITE_SKYVERN_API_KEY:-}" ]] && [[ -f "/app/.streamlit/secrets.toml" ]]; then
  VITE_SKYVERN_API_KEY=$(sed -n 's/.*cred\s*=\s*"\([^"]*\)".*/\1/p' /app/.streamlit/secrets.toml)
  export VITE_SKYVERN_API_KEY
fi

# Compute a stable, hardware-based system fingerprint for license validation.
# Persist it under the shared .streamlit volume so it remains stable across container restarts.
if [[ -z "${VITE_SYSTEM_FINGERPRINT:-}" ]]; then
  persist_dir="/app/.streamlit"
  persist_file="${persist_dir}/system_fingerprint"
  if [[ -r "$persist_file" ]]; then
    VITE_SYSTEM_FINGERPRINT=$(tr -d '\n' < "$persist_file")
  else
    # Preference order (Linux): hardware UUID -> machine-id -> hostname
    candidate=""
    if [[ -r "/sys/class/dmi/id/product_uuid" ]]; then
      candidate=$(tr -d '\n' < /sys/class/dmi/id/product_uuid)
    elif [[ -r "/etc/machine-id" ]]; then
      candidate=$(tr -d '\n' < /etc/machine-id)
    else
      candidate=$(hostname)
    fi
    # Normalize and hash to avoid exposing raw identifiers while keeping stability
    if command -v sha256sum >/dev/null 2>&1; then
      VITE_SYSTEM_FINGERPRINT=$(printf "%s" "$candidate" | sha256sum | awk '{print $1}')
    else
      VITE_SYSTEM_FINGERPRINT="$candidate"
    fi
    mkdir -p "$persist_dir"
    printf "%s\n" "$VITE_SYSTEM_FINGERPRINT" > "$persist_file"
  fi
  export VITE_SYSTEM_FINGERPRINT
fi

# Start the UI (Vite preview + artifact server)
npm run start
