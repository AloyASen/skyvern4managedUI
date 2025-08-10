import { create } from "zustand";

export type LicenseProfile = {
  name: string | null;
  email: string | null;
  licenseType: string | null;
  market: string | null;
  plan: string | null;
};

type ProfileState = {
  profile: LicenseProfile | null;
  setProfile: (profile: LicenseProfile | null) => void;
  getProfile: () => LicenseProfile | null;
};

const STORAGE_KEY = "skyvern.licenseProfile";

const initialProfile: LicenseProfile | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LicenseProfile) : null;
  } catch {
    return null;
  }
})();

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: initialProfile,
  setProfile: (profile) => {
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage failures
    }
    set({ profile });
  },
  getProfile: () => get().profile,
}));

