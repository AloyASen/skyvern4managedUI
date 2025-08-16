from uuid import uuid4

from skyvern.forge import app
from skyvern.forge.sdk.schemas.credentials import Credential, CredentialType


async def create_credential(*, organization_id: str, name: str, credential_type: CredentialType) -> Credential:
    """Create a credential with a generated UUID4 item_id.

    This keeps the frontend payloads simple by injecting the required
    ``item_id`` internally prior to persistence.
    """
    item_id = str(uuid4())
    return await app.DATABASE.create_credential(
        name=name,
        credential_type=credential_type,
        organization_id=organization_id,
        item_id=item_id,
    )

