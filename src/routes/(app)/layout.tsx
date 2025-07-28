import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AccountMenu } from "@/components/account-menu";
import { AppSidebar } from "@/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getIsomorphicSession } from "@/lib/auth/get-isomorphic-session";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async () => {
		const data = await getIsomorphicSession();

		if (!data?.session) {
			throw redirect({ to: "/login" });
		}

		return { session: data.session, user: data.user };
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<header className="flex h-[var(--sidebar-width-icon)] shrink-0 items-center gap-2 transition-[width,height] ease-linear">
					<div className="flex flex-1 items-center justify-between px-2">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger />
							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem className="hidden md:block">
										<BreadcrumbLink href="/">Tota</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator className="hidden md:block" />
									<BreadcrumbItem>
										<BreadcrumbPage>Profile</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						</div>
						<AccountMenu />
					</div>
				</header>
				<Separator />
				<div className="min-h-[100vh] flex-1 rounded-xl py-6 md:min-h-min overflow-hidden">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
