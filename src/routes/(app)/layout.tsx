import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { AccountPopover } from "@/components/account-popover";
import { AppSidebar } from "@/components/app-sidebar";
import { AvatarUser } from "@/components/avatar-user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth/auth-client";
import { getIsomorphicSession } from "@/lib/auth/get-isomorphic-session";
import { stringAvatar } from "@/utils/conversion/text";

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
	const user = Route.useRouteContext({ select: (d) => d.user });
	const router = useRouter();
	const isMobile = useIsMobile();

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<header className="flex h-[var(--sidebar-width-icon)] shrink-0 items-center gap-2 transition-[width,height] ease-linear">
					<div className="flex flex-1 items-center justify-between px-2">
						{isMobile ? <SidebarTrigger /> : <div />}
						<AccountPopover>
							<AvatarUser
								email={user.email}
								fullName={user.name}
								initials={stringAvatar(user.name)}
							/>
							<Link
								to="/profile"
								className={buttonVariants({
									variant: "ghost",
									size: "sm",
									className:
										"justify-between! flex w-full flex-row px-2 uppercase",
								})}
							>
								<span>Profile</span>
								<ArrowRightIcon size={18} />
							</Link>
							<Separator />
							<Button
								className="w-full uppercase"
								onClick={async () => {
									await authClient.signOut({
										fetchOptions: {
											onSuccess: () => {
												router.invalidate();
											},
										},
									});
								}}
								rel="noreferrer"
								variant="outline"
							>
								logout
							</Button>
						</AccountPopover>
					</div>
				</header>
				<div className="min-h-[100vh] flex-1 rounded-xl bg-linear-[var(--background-primary-gradient)] p-6 md:min-h-min overflow-hidden">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
