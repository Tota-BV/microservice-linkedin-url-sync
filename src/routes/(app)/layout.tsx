import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getIsomorphicSession } from "@/lib/auth/get-isomorphic-session";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async () => {
    const data = await getIsomorphicSession();

    if (!data?.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  // const location = useLocation();
  // const paths = location.pathname.split("/");
  // const breadcrumb = paths.map((path) => {
  //   return {
  //     label: path,
  //     href: `/${path}`,
  //   };
  // });

  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-[var(--sidebar-width-icon)] shrink-0 items-center gap-2 transition-[width,height] ease-linear">
          {isMobile ? <SidebarTrigger /> : null}
        </header>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-linear-[var(--background-primary-gradient)] p-6 md:min-h-min overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
