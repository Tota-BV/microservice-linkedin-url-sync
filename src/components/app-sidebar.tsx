import {
  BookOpenTextIcon,
  CalendarCheckIcon,
  CogIcon,
  FileIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
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
      title: "Candidate Verification",
      url: "#",
      icon: ShieldCheckIcon,
    },
    {
      title: "Candidates",
      url: "#",
      icon: UserRoundCheckIcon,
    },
    {
      title: "Schedule check & Matches",
      url: "#",
      icon: CalendarCheckIcon,
    },
    {
      title: "Chats",
      url: "#",
      icon: MessageCircleMoreIcon,
    },
    {
      title: "Knowledge bank",
      url: "#",
      icon: BookOpenTextIcon,
    },
    {
      title: "Invoices",
      url: "#",
      icon: CogIcon,
    },

    {
      title: "Settings",
      url: "#",
      icon: CogIcon,
    },

    {
      title: "Profile",
      url: "#",
      icon: CogIcon,
    },
    {
      title: "Compliance",
      url: "#",
      icon: CogIcon,
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
