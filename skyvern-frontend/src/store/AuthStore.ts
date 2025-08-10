import { create } from "zustand";
import {
  setAuthorizationHeader,
  removeAuthorizationHeader,
  setOrganizationIdHeader,
  removeOrganizationIdHeader,
} from "@/api/AxiosClient";

type AuthState = {
  token: string | null;
  organizationID: string | null;
  setAuth: (token: string | null, organizationID: string | null) => void;
  getToken: () => string | null;
  getOrganizationID: () => string | null;
};

const initialToken =
  typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
const initialOrg =
  typeof window !== "undefined" ? localStorage.getItem("organizationID") : null;
if (initialToken) {
  setAuthorizationHeader(initialToken);
}
if (initialOrg) {
  setOrganizationIdHeader(initialOrg);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  organizationID: initialOrg,
  setAuth: (token, organizationID) => {
    if (token) {
      localStorage.setItem("authToken", token);
      setAuthorizationHeader(token);
    } else {
      localStorage.removeItem("authToken");
      removeAuthorizationHeader();
    }
    if (organizationID) {
      localStorage.setItem("organizationID", organizationID);
      setOrganizationIdHeader(organizationID);
    } else {
      localStorage.removeItem("organizationID");
      removeOrganizationIdHeader();
    }
    set({ token, organizationID });
  },
  getToken: () => get().token,
  getOrganizationID: () => get().organizationID,
}));
