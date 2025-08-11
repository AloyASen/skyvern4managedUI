import { CompassIcon } from "@/components/icons/CompassIcon";
import { NavLinkGroup } from "@/components/NavLinkGroup";
import { useSidebarStore } from "@/store/SidebarStore";
import { cn } from "@/util/utils";
import {
  CounterClockwiseClockIcon,
  GearIcon,
  LightningBoltIcon,
} from "@radix-ui/react-icons";

function SideNav() {
  const { collapsed } = useSidebarStore();

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
