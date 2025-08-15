import structlog
from fastapi import Body, Depends, HTTPException, Path, Query

from skyvern.forge import app
from skyvern.forge.prompts import prompt_engine
from skyvern.forge.sdk.routes.code_samples import (
    CREATE_CREDENTIAL_CODE_SAMPLE,
    CREATE_CREDENTIAL_CODE_SAMPLE_CREDIT_CARD,
    DELETE_CREDENTIAL_CODE_SAMPLE,
    GET_CREDENTIAL_CODE_SAMPLE,
    GET_CREDENTIALS_CODE_SAMPLE,
    SEND_TOTP_CODE_CODE_SAMPLE,
)
from skyvern.forge.sdk.routes.routers import base_router, legacy_base_router
from skyvern.forge.sdk.schemas.credentials import (
    CreateCredentialRequest,
    CredentialResponse,
    CredentialType,
    CreditCardCredentialResponse,
    PasswordCredentialResponse,
)
from skyvern.forge.sdk.schemas.organizations import Organization
from skyvern.forge.sdk.schemas.totp_codes import TOTPCode, TOTPCodeCreate
from skyvern.forge.sdk.services import org_auth_service

LOG = structlog.get_logger()


async def parse_totp_code(content: str) -> str | None:
    prompt = prompt_engine.load_prompt("parse-verification-code", content=content)
    code_resp = await app.SECONDARY_LLM_API_HANDLER(prompt=prompt, prompt_name="parse-verification-code")
    LOG.info("TOTP Code Parser Response", code_resp=code_resp)
    return code_resp.get("code", None)


@legacy_base_router.post("/totp")
@legacy_base_router.post("/totp/", include_in_schema=False)
@base_router.post(
    "/credentials/totp",
    response_model=TOTPCode,
    summary="Send TOTP code",
    description="Forward a TOTP (2FA, MFA) email or sms message containing the code to Skyvern. This endpoint stores the code in database so that Skyvern can use it while running tasks/workflows.",
    tags=["Credentials"],
    openapi_extra={
        "x-fern-sdk-method-name": "send_totp_code",
        "x-fern-examples": [{"code-samples": [{"sdk": "python", "code": SEND_TOTP_CODE_CODE_SAMPLE}]}],
    },
)
@base_router.post(
    "/credentials/totp/",
    response_model=TOTPCode,
    include_in_schema=False,
)
async def send_totp_code(
    data: TOTPCodeCreate, curr_org: Organization = Depends(org_auth_service.get_current_org)
) -> TOTPCode:
    LOG.info(
        "Saving TOTP code",
        organization_id=curr_org.organization_id,
        totp_identifier=data.totp_identifier,
        task_id=data.task_id,
        workflow_id=data.workflow_id,
        workflow_run_id=data.workflow_run_id,
    )
    content = data.content.strip()
    code: str | None = content
    # We assume the user is sending the code directly when the length of code is less than or equal to 10
    if len(content) > 10:
        code = await parse_totp_code(content)
    if not code:
        LOG.error(
            "Failed to parse totp code",
            totp_identifier=data.totp_identifier,
            task_id=data.task_id,
            workflow_id=data.workflow_id,
            workflow_run_id=data.workflow_run_id,
            content=data.content,
        )
        raise HTTPException(status_code=400, detail="Failed to parse totp code")
    return await app.DATABASE.create_totp_code(
        organization_id=curr_org.organization_id,
        totp_identifier=data.totp_identifier,
        content=data.content,
        code=code,
        task_id=data.task_id,
        workflow_id=data.workflow_id,
        workflow_run_id=data.workflow_run_id,
        source=data.source,
        expired_at=data.expired_at,
    )


@legacy_base_router.post("/credentials")
@legacy_base_router.post("/credentials/", include_in_schema=False)
@base_router.post(
    "/credentials",
    response_model=CredentialResponse,
    status_code=201,
    summary="Create credential",
    description="Creates a new credential for the current organization",
    tags=["Credentials"],
    openapi_extra={
        "x-fern-sdk-method-name": "create_credential",
        "x-fern-examples": [
            {
                "code-samples": [
                    {"sdk": "python", "code": CREATE_CREDENTIAL_CODE_SAMPLE},
                    {"sdk": "python", "code": CREATE_CREDENTIAL_CODE_SAMPLE_CREDIT_CARD},
                ]
            }
        ],
    },
)
@base_router.post(
    "/credentials/",
    response_model=CredentialResponse,
    status_code=201,
    include_in_schema=False,
)
async def create_credential(
    data: CreateCredentialRequest = Body(
        ...,
        description="The credential data to create",
        example={
            "name": "My Credential",
            "credential_type": "PASSWORD",
            "credential": {"username": "user@example.com", "password": "securepassword123", "totp": "JBSWY3DPEHPK3PXP"},
        },
        openapi_extra={"x-fern-sdk-parameter-name": "data"},
    ),
    current_org: Organization = Depends(org_auth_service.get_current_org),
) -> CredentialResponse:
    # Create base credential row
    credential = await app.DATABASE.create_credential(
        organization_id=current_org.organization_id,
        name=data.name,
        credential_type=data.credential_type,
    )

    if data.credential_type == CredentialType.PASSWORD:
        # Persist password secret in Postgres
        await app.DATABASE.create_password_secret(
            credential_id=credential.credential_id,
            username=data.credential.username,
            password=data.credential.password,
            totp=data.credential.totp,
        )
        credential_response = PasswordCredentialResponse(username=data.credential.username)
        return CredentialResponse(
            credential=credential_response,
            credential_id=credential.credential_id,
            credential_type=data.credential_type,
            name=data.name,
        )
    elif data.credential_type == CredentialType.CREDIT_CARD:
        # Persist credit card secret in Postgres
        await app.DATABASE.create_credit_card_secret(
            credential_id=credential.credential_id,
            card_number=data.credential.card_number,
            card_cvv=data.credential.card_cvv,
            card_exp_month=data.credential.card_exp_month,
            card_exp_year=data.credential.card_exp_year,
            card_brand=data.credential.card_brand,
            card_holder_name=data.credential.card_holder_name,
        )
        credential_response = CreditCardCredentialResponse(last_four=data.credential.card_number[-4:], brand=data.credential.card_brand)
        return CredentialResponse(
            credential=credential_response,
            credential_id=credential.credential_id,
            credential_type=data.credential_type,
            name=data.name,
        )


@legacy_base_router.delete("/credentials/{credential_id}")
@legacy_base_router.delete("/credentials/{credential_id}/", include_in_schema=False)
@base_router.post(
    "/credentials/{credential_id}/delete",
    status_code=204,
    summary="Delete credential",
    description="Deletes a specific credential by its ID",
    tags=["Credentials"],
    openapi_extra={
        "x-fern-sdk-method-name": "delete_credential",
        "x-fern-examples": [{"code-samples": [{"sdk": "python", "code": DELETE_CREDENTIAL_CODE_SAMPLE}]}],
    },
)
@base_router.post(
    "/credentials/{credential_id}/delete/",
    status_code=204,
    include_in_schema=False,
)
async def delete_credential(
    credential_id: str = Path(
        ...,
        description="The unique identifier of the credential to delete",
        examples=["cred_1234567890"],
        openapi_extra={"x-fern-sdk-parameter-name": "credential_id"},
    ),
    current_org: Organization = Depends(org_auth_service.get_current_org),
) -> None:
    credential = await app.DATABASE.get_credential(
        credential_id=credential_id, organization_id=current_org.organization_id
    )
    if not credential:
        raise HTTPException(status_code=404, detail=f"Credential not found, credential_id={credential_id}")

    await app.DATABASE.delete_credential(credential.credential_id, current_org.organization_id)

    return None


@legacy_base_router.get("/credentials/{credential_id}")
@legacy_base_router.get("/credentials/{credential_id}/", include_in_schema=False)
@base_router.get(
    "/credentials/{credential_id}",
    response_model=CredentialResponse,
    summary="Get credential by ID",
    description="Retrieves a specific credential by its ID",
    tags=["Credentials"],
    openapi_extra={
        "x-fern-sdk-method-name": "get_credential",
        "x-fern-examples": [{"code-samples": [{"sdk": "python", "code": GET_CREDENTIAL_CODE_SAMPLE}]}],
    },
)
@base_router.get(
    "/credentials/{credential_id}/",
    response_model=CredentialResponse,
    include_in_schema=False,
)
async def get_credential(
    credential_id: str = Path(
        ...,
        description="The unique identifier of the credential",
        examples=["cred_1234567890"],
        openapi_extra={"x-fern-sdk-parameter-name": "credential_id"},
    ),
    current_org: Organization = Depends(org_auth_service.get_current_org),
) -> CredentialResponse:
    credential = await app.DATABASE.get_credential(
        credential_id=credential_id, organization_id=current_org.organization_id
    )
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    if credential.credential_type == CredentialType.PASSWORD:
        secret = await app.DATABASE.get_password_secret(credential.credential_id)
        if not secret:
            raise HTTPException(status_code=404, detail="Credential not found")
        credential_response = PasswordCredentialResponse(username=secret.username)
        return CredentialResponse(
            credential=credential_response,
            credential_id=credential.credential_id,
            credential_type=credential.credential_type,
            name=credential.name,
        )
    if credential.credential_type == CredentialType.CREDIT_CARD:
        secret = await app.DATABASE.get_credit_card_secret(credential.credential_id)
        if not secret:
            raise HTTPException(status_code=404, detail="Credential not found")
        credential_response = CreditCardCredentialResponse(last_four=secret.card_number[-4:], brand=secret.card_brand)
        return CredentialResponse(
            credential=credential_response,
            credential_id=credential.credential_id,
            credential_type=credential.credential_type,
            name=credential.name,
        )
    raise HTTPException(status_code=400, detail="Invalid credential type")


@legacy_base_router.get("/credentials")
@legacy_base_router.get("/credentials/", include_in_schema=False)
@base_router.get(
    "/credentials",
    response_model=list[CredentialResponse],
    summary="Get all credentials",
    description="Retrieves a paginated list of credentials for the current organization",
    tags=["Credentials"],
    openapi_extra={
        "x-fern-sdk-method-name": "get_credentials",
        "x-fern-examples": [{"code-samples": [{"sdk": "python", "code": GET_CREDENTIALS_CODE_SAMPLE}]}],
    },
)
@base_router.get(
    "/credentials/",
    response_model=list[CredentialResponse],
    include_in_schema=False,
)
async def get_credentials(
    current_org: Organization = Depends(org_auth_service.get_current_org),
    page: int = Query(
        1,
        ge=1,
        description="Page number for pagination",
        examples=[1],
        openapi_extra={"x-fern-sdk-parameter-name": "page"},
    ),
    page_size: int = Query(
        10,
        ge=1,
        description="Number of items per page",
        examples=[10],
        openapi_extra={"x-fern-sdk-parameter-name": "page_size"},
    ),
) -> list[CredentialResponse]:
    credentials = await app.DATABASE.get_credentials(current_org.organization_id, page=page, page_size=page_size)
    response_items: list[CredentialResponse] = []
    for cred in credentials:
        if cred.credential_type == CredentialType.PASSWORD:
            secret = await app.DATABASE.get_password_secret(cred.credential_id)
            if not secret:
                continue
            response_items.append(
                CredentialResponse(
                    credential=PasswordCredentialResponse(username=secret.username),
                    credential_id=cred.credential_id,
                    credential_type=cred.credential_type,
                    name=cred.name,
                )
            )
        elif cred.credential_type == CredentialType.CREDIT_CARD:
            secret = await app.DATABASE.get_credit_card_secret(cred.credential_id)
            if not secret:
                continue
            response_items.append(
                CredentialResponse(
                    credential=CreditCardCredentialResponse(last_four=secret.card_number[-4:], brand=secret.card_brand),
                    credential_id=cred.credential_id,
                    credential_type=cred.credential_type,
                    name=cred.name,
                )
            )
    return response_items
