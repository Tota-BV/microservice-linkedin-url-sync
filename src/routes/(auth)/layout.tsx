import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getIsomorphicSession } from "@/lib/auth/get-isomorphic-session";

export const Route = createFileRoute("/(auth)")({
	beforeLoad: async () => {
		const data = await getIsomorphicSession();

		if (data?.session) {
			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="relative hidden bg-muted lg:block">
				<img
					src="/login-bg.webp"
					alt="login-bg"
					className="absolute inset-0 h-full w-full object-cover dark:grayscale"
				/>
			</div>
			<div className="flex flex-col gap-4 bg-linear-[var(--background-primary-gradient)] p-6 md:p-10">
				<div className="flex flex-1 flex-col items-center justify-center gap-10">
					<div className="flex justify-center ">
						<img alt="logo" src="/tota-logo-dark.svg" className="h-auto w-40" />
					</div>
					<Outlet />
				</div>
			</div>
		</div>
	);
}
