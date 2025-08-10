import { apiBaseUrl, artifactApiBaseUrl, envCredential } from "@/util/env";
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

type ApiVersion = "sans-api-v1" | "v1" | "v2";

const apiV1BaseUrl = apiBaseUrl;
const apiV2BaseUrl = apiBaseUrl.replace("v1", "v2");
const url = new URL(apiBaseUrl);
const pathname = url.pathname.replace("/api", "");
const apiSansApiV1BaseUrl = `${url.origin}${pathname}`;

const v1BaseHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (envCredential) {
  v1BaseHeaders["x-api-key"] = envCredential;
}
const client = axios.create({
  baseURL: apiV1BaseUrl,
  headers: v1BaseHeaders,
});

const v2BaseHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (envCredential) {
  v2BaseHeaders["x-api-key"] = envCredential;
}
const v2Client = axios.create({
  baseURL: apiV2BaseUrl,
  headers: v2BaseHeaders,
});

const sansApiBaseHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (envCredential) {
  sansApiBaseHeaders["x-api-key"] = envCredential;
}
const clientSansApiV1 = axios.create({
  baseURL: apiSansApiV1BaseUrl,
  headers: sansApiBaseHeaders,
});

const artifactApiClient = axios.create({
  baseURL: artifactApiBaseUrl,
});

const ORG_HEADER = "X-Organization-ID";

export function setAuthorizationHeader(token: string) {
  client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  v2Client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  clientSansApiV1.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  // Prefer Authorization over API key
  removeApiKeyHeader();
}

export function removeAuthorizationHeader() {
  if (client.defaults.headers.common["Authorization"]) {
    delete client.defaults.headers.common["Authorization"];
    delete v2Client.defaults.headers.common["Authorization"];
    delete clientSansApiV1.defaults.headers.common["Authorization"];
  }
  // Restore env API key if configured
  if (envCredential) {
    setApiKeyHeader(envCredential);
  }
}

export function setOrganizationIdHeader(organizationId: string) {
  client.defaults.headers.common[ORG_HEADER] = organizationId;
  v2Client.defaults.headers.common[ORG_HEADER] = organizationId;
  clientSansApiV1.defaults.headers.common[ORG_HEADER] = organizationId;
  artifactApiClient.defaults.headers.common[ORG_HEADER] = organizationId;
}

export function removeOrganizationIdHeader() {
  // Remove org header from all clients if present
  if (client.defaults.headers.common[ORG_HEADER]) {
    delete client.defaults.headers.common[ORG_HEADER];
  }
  if (v2Client.defaults.headers.common[ORG_HEADER]) {
    delete v2Client.defaults.headers.common[ORG_HEADER];
  }
  if (clientSansApiV1.defaults.headers.common[ORG_HEADER]) {
    delete clientSansApiV1.defaults.headers.common[ORG_HEADER];
  }
  if (artifactApiClient.defaults.headers.common[ORG_HEADER]) {
    delete artifactApiClient.defaults.headers.common[ORG_HEADER];
  }
}

export function setApiKeyHeader(apiKey: string) {
  client.defaults.headers.common["x-api-key"] = apiKey;
  v2Client.defaults.headers.common["x-api-key"] = apiKey;
  clientSansApiV1.defaults.headers.common["x-api-key"] = apiKey;
}

export function removeApiKeyHeader() {
  delete client.defaults.headers.common["x-api-key"];
  delete v2Client.defaults.headers.common["x-api-key"];
  delete clientSansApiV1.defaults.headers.common["x-api-key"];
}

async function getClient(
  credentialGetter: CredentialGetter | null,
  version: ApiVersion = "v1",
) {
  // Best-effort: ensure Authorization header is set from persisted token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token && !client.defaults.headers.common["Authorization"]) {
      setAuthorizationHeader(token);
    }
    // Prefer Authorization when token exists; otherwise use env API key if available
    if (token) {
      removeApiKeyHeader();
    } else if (envCredential) {
      setApiKeyHeader(envCredential);
    }
    const organizationId = (() => {
      try {
        return (
          (typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("organizationID")) ||
          localStorage.getItem("organizationID")
        );
      } catch {
        return localStorage.getItem("organizationID");
      }
    })();
    if (organizationId) {
      setOrganizationIdHeader(organizationId);
    } else {
      removeOrganizationIdHeader();
    }
  }
  const get = () => {
    switch (version) {
      case "sans-api-v1":
        return clientSansApiV1;
      case "v1":
        return client;
      case "v2":
        return v2Client;
      default: {
        throw new Error(`Unknown version: ${version}`);
      }
    }
  };

  if (credentialGetter) {
    removeApiKeyHeader();

    const credential = await credentialGetter();

    if (!credential) {
      console.warn("No credential found");
      return get();
    }

    setAuthorizationHeader(credential);
  }

  return get();
}

export type CredentialGetter = () => Promise<string | null>;

export { getClient, artifactApiClient };

// Ensure per-request headers reflect the current session state
function attachInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem("authToken");
      const orgId =
        (typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("organizationID")) ||
        localStorage.getItem("organizationID");

      // Prefer bearer token over API key
      if (token) {
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
        delete (config.headers as any)["x-api-key"];
        delete (config.headers as any)["X-API-Key"];
      } else if (envCredential) {
        (config.headers as any)["x-api-key"] = envCredential;
      }

      if (orgId) {
        (config.headers as any)[ORG_HEADER] = orgId;
      }
    } catch (e) {
      // ignore storage issues
    }
    return config;
  });
}

attachInterceptors(client);
attachInterceptors(v2Client);
attachInterceptors(clientSansApiV1);
attachInterceptors(artifactApiClient as any);
