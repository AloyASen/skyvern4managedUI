"""
Shim module for credential schemas.

This module exists to provide a singular "credential" schema path while
reusing the core models defined in ``schemas/credentials.py``.
"""

from .credentials import (
    Credential,
    CredentialItem,
    CredentialResponse,
    CredentialType,
    CreateCredentialRequest,
    CreditCardCredential,
    CreditCardCredentialResponse,
    NonEmptyCreditCardCredential,
    NonEmptyPasswordCredential,
    PasswordCredential,
    PasswordCredentialResponse,
)

__all__ = [
    "Credential",
    "CredentialItem",
    "CredentialResponse",
    "CredentialType",
    "CreateCredentialRequest",
    "CreditCardCredential",
    "CreditCardCredentialResponse",
    "NonEmptyCreditCardCredential",
    "NonEmptyPasswordCredential",
    "PasswordCredential",
    "PasswordCredentialResponse",
]

