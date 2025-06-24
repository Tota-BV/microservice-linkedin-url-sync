import {
  BookOpenTextIcon,
  CalendarCheckIcon,
  CogIcon,
  DollarSignIcon,
  MessageCircleMoreIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Candidates",
      url: "/candidates",
      icon: UserRoundCheckIcon,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: CogIcon,
    },
    {
      title: "Tokens",
      url: "/tokens",
      icon: DollarSignIcon,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: DollarSignIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div
          className={`flex grow items-center ${open ? "px-5" : "justify-center"}`}
        >
          {open ? (
            <img
              alt="logo"
              src="/tota-logo-light.svg"
              className="h-auto w-24"
            />
          ) : (
            <img
              alt="logo"
              src="/tota-logo-single.svg"
              className="h-8 w-auto"
            />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-4 px-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center gap-1">
          <SidebarTrigger className="w-full" />
        </div>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
