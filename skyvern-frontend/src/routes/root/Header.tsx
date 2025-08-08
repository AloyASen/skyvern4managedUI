import { DiscordLogoIcon } from "@radix-ui/react-icons";
import GitHubButton from "react-github-btn";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { NavigationHamburgerMenu } from "./NavigationHamburgerMenu";
import { useAuthStore } from "@/store/AuthStore";

function Header() {
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed");
  const match =
    useMatch("/workflows/:workflowPermanentId/edit") ||
    location.pathname.includes("debug") ||
    embed === "true";

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  if (match) {
    return null;
  }

  const handleLogout = () => {
    setAuth(null, null);
    navigate("/login");
  };

  return (
    <header>
      <div className="flex h-24 items-center px-6">
        <NavigationHamburgerMenu />
        <div className="ml-auto flex gap-4">
          <button onClick={handleLogout} className="text-sm underline">
            Logout
          </button>
          <Link
            to="https://discord.com/invite/fG2XXEuQX3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <DiscordLogoIcon className="h-7 w-7" />
          </Link>
          <div className="h-7">
            <GitHubButton
              href="https://github.com/skyvern-ai/skyvern"
              data-color-scheme="no-preference: dark; light: dark; dark: dark;"
              data-size="large"
              data-show-count="true"
              aria-label="Star skyvern-ai/skyvern on GitHub"
            >
              Star
            </GitHubButton>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
