import base64
import os
import hashlib
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from skyvern.config import settings


_VERSION = "v1"


def _derive_key() -> bytes:
    """
    Derive a 32-byte AES key from settings.SECRET_KEY using SHA-256.
    """
    secret = settings.SECRET_KEY
    if not secret:
        raise RuntimeError("SECRET_KEY is not set; required for encrypting secrets")
    return hashlib.sha256(secret.encode("utf-8")).digest()


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("ascii")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s.encode("ascii"))


def encrypt_str(plaintext: str) -> str:
    """
    Encrypt a UTF-8 string using AES-GCM and return a versioned token string:
    "v1:<nonce_b64>:<ciphertext_b64>"
    """
    key = _derive_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), associated_data=None)
    return f"{_VERSION}:{_b64e(nonce)}:{_b64e(ct)}"


def decrypt_str(token: str) -> str:
    """
    Decrypt a token produced by encrypt_str.
    """
    try:
        version, nonce_b64, ct_b64 = token.split(":", 2)
    except ValueError:
        raise ValueError("Invalid ciphertext format")
    if version != _VERSION:
        raise ValueError(f"Unsupported ciphertext version: {version}")
    key = _derive_key()
    aesgcm = AESGCM(key)
    pt = aesgcm.decrypt(_b64d(nonce_b64), _b64d(ct_b64), associated_data=None)
    return pt.decode("utf-8")

