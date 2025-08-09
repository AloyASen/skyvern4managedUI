#!/bin/bash

set -e

# setting api key
VITE_SKYVERN_API_KEY=$(sed -n 's/.*cred\s*=\s*"\([^"]*\)".*/\1/p' .streamlit/secrets.toml)
export VITE_SKYVERN_API_KEY
# compute system fingerprint for license validation
VITE_SYSTEM_FINGERPRINT=$(python -c 'from skyvern.utils.fingerprint import SYSTEM_FINGERPRINT; print(SYSTEM_FINGERPRINT)')
export VITE_SYSTEM_FINGERPRINT
npm run start


