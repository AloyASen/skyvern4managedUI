import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";
import { NavigationHamburgerMenu } from "./NavigationHamburgerMenu";
import { useAuthStore } from "@/store/AuthStore";
import { useProfileStore } from "@/store/ProfileStore";
import { queryClient } from "@/api/QueryClient";
import { toast } from "@/components/ui/use-toast";

function Header() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all cached queries to avoid cross-org data leakage
    try {
      queryClient.clear();
    } catch {
      // best-effort cache clear
    }
    setAuth(null, null);
    setProfile(null);
    toast({
      variant: "success",
      title: "Logged out",
      description: "You have been signed out.",
    });
    navigate("/login");
  };

  const initials = (() => {
    const name = profile?.name ?? "";
    if (!name.trim()) return "U";
    const parts = name.trim().split(/\s+/);
    const letters = parts.slice(0, 3).map((p) => p.charAt(0).toUpperCase());
    return letters.join("") || "U";
  })();

  return (
    <header>
      <div className="flex h-24 items-center px-6">
        <NavigationHamburgerMenu />
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white"
                aria-label="User profile"
                title={profile?.name ?? "Profile"}
              >
                {initials}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-64 rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-white shadow-lg"
              >
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">name:</span> {profile?.name ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">email:</span> {profile?.email ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">licenseType:</span> {profile?.licenseType ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">market:</span> {profile?.market ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">plan:</span> {profile?.plan ?? "—"}
                  </div>
                </div>
                <div className="my-3 h-px w-full bg-slate-700" />
                <DropdownMenu.Item asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded bg-red-600 px-3 py-2 text-left text-white hover:bg-red-500"
                  >
                    Logout
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

export { Header };
