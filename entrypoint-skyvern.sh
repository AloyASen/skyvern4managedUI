#!/bin/bash

set -e

# check alembic
if ! alembic upgrade head; then
    echo "Alembic upgrade failed" >&2
    exit 1
fi
# Optional: run alembic check (requires model metadata). Disabled by default in compiled images.
if [ "${SKYVERN_ALEMBIC_CHECK:-0}" = "1" ]; then
  alembic check || true
fi

if [ ! -f ".streamlit/secrets.toml" ]; then
    echo "Creating organization and API token..."
    org_output=$(python -m scripts.create_organization Skyvern-Open-Source)
    api_token=$(echo "$org_output" | awk '/token=/{gsub(/.*token='\''|'\''.*/, ""); print}')
    # Update the secrets-open-source.toml file
    echo -e "[skyvern]\nconfigs = [\n    {\"env\" = \"local\", \"host\" = \"http://skyvern:8000/api/v1\", \"orgs\" = [{name=\"Skyvern\", cred=\"$api_token\"}]}\n]" > .streamlit/secrets.toml
    echo ".streamlit/secrets.toml file updated with organization details."
fi

_kill_xvfb_on_term() {
  kill -TERM $xvfb
}

# Setup a trap to catch SIGTERM and relay it to child processes
trap _kill_xvfb_on_term TERM

echo "Starting Xvfb..."
# delete the lock file if any
rm -f /tmp/.X99-lock
# Set display environment variable
export DISPLAY=:99
# Start Xvfb
Xvfb :99 -screen 0 1920x1080x16 &
xvfb=$!

DISPLAY=:99 xterm 2>/dev/null &

# Launch optional streaming task if available
if python - >/dev/null 2>&1 <<'PY'
import importlib
importlib.import_module('skyvern.streaming.run_streaming')
PY
then
  python -m skyvern.streaming.run_streaming > /dev/null &
else
  echo "Streaming module not available; skipping."
fi

# Quick import diagnostics before starting
python - <<'PY'
import importlib, traceback, pkgutil, sys, os, pathlib
for name in ['skyvern', 'skyvern.forge.api_app']:
    try:
        m = importlib.import_module(name)
        print(f"[import-ok] {name} -> {m}")
    except Exception as e:
        print(f"[import-fail] {name}: {e}")
        traceback.print_exc()
try:
    import skyvern
    print('[skyvern-path]', list(getattr(skyvern, '__path__', [])))
    for p in getattr(skyvern, '__path__', []):
        try:
            print('[skyvern-dir]', p, 'entries=', os.listdir(p))
            forge_dir = os.path.join(p, 'forge')
            print('[forge-exists]', forge_dir, os.path.isdir(forge_dir))
            if os.path.isdir(forge_dir):
                print('[forge-entries]', os.listdir(forge_dir))
                cp = os.path.join(forge_dir, '__pycache__')
                if os.path.isdir(cp):
                    print('[forge-pyc]', os.listdir(cp))
        except Exception as e:
            print('[inspect-error]', e)
except Exception as e:
    print('[skyvern-inspect-fail]', e)
PY

# Start API server via uvicorn to avoid relying on package __main__
exec uvicorn skyvern.forge.api_app:get_agent_app --factory --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
