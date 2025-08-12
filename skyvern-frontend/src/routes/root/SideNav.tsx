import { CompassIcon } from "@/components/icons/CompassIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { NavLinkGroup } from "@/components/NavLinkGroup";
import { useSidebarStore } from "@/store/SidebarStore";
import { useProfileStore } from "@/store/ProfileStore";
import { cn } from "@/util/utils";
import {
  CounterClockwiseClockIcon,
  GearIcon,
  LightningBoltIcon,
} from "@radix-ui/react-icons";

function SideNav() {
  const { collapsed } = useSidebarStore();
  // Treat presence of a profile as validated license
  const hasValidatedLicense = !!useProfileStore((s) => s.profile);

  return (
    <nav
      className={cn("space-y-5", {
        "items-center": collapsed,
      })}
    >
      <NavLinkGroup
        title="Build"
        links={[
          {
            label: "Discover",
            to: "/dashboard/discover",
            icon: <CompassIcon className="size-6" />,
          },
          {
            label: "Workflows",
            to: "/dashboard/workflows",
            icon: <LightningBoltIcon className="size-6" />,
          },
          {
            label: "History",
            to: "/dashboard/history",
            icon: <CounterClockwiseClockIcon className="size-6" />,
          },
        ]}
      />
      <NavLinkGroup
        title={"General"}
        links={[
          {
            label: "Documentation",
            to: "https://docs.openalgo.in/",
            newTab: true,
            // Show a docs icon (badge-style indicator) when license is validated
            icon: hasValidatedLicense ? <BookIcon className="size-6" /> : undefined,
          },
          {
            label: "Settings",
            to: "/dashboard/settings",
            icon: <GearIcon className="size-6" />,
          },
        ]}
      />
    </nav>
  );
}

export { SideNav };
