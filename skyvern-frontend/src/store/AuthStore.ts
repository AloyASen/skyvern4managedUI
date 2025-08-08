import { create } from "zustand";
import {
  setAuthorizationHeader,
  removeAuthorizationHeader,
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
    } else {
      localStorage.removeItem("organizationID");
    }
    set({ token, organizationID });
  },
  getToken: () => get().token,
  getOrganizationID: () => get().organizationID,
}));
