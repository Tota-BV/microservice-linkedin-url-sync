import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import LoginForm from "@/features/login/ui/login-form";
import { sendVerificiationMail } from "@/lib/mail/send-user-confirmation";

export const Route = createFileRoute("/(auth)/login")({
	component: RouteComponent,
});

const foo = createServerFn().handler(async () => {
	try {
		console.log("1");
		await sendVerificiationMail({
			verificationUrl: "123",
			email: "test@test.nl",
		});
		console.log("YESSIR");
	} catch (err) {
		console.log(err);
	}
});

function RouteComponent() {
	return (
		<div>
			<Button
				onClick={() => {
					foo();
				}}
			>
				TEST
			</Button>
			<Card className="min-w-md gap-6">
				<CardHeader>
					<CardTitle className="font-display text-2xl">
						Login to your account
					</CardTitle>
					<CardDescription className="text-balance text-sm">
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<LoginForm />
				</CardContent>
			</Card>
			<div className="mt-4 text-center text-sm">
				Don&apos;t have an account?{" "}
				<Link to="/register" className="underline underline-offset-4">
					Register
				</Link>
			</div>
		</div>
	);
}
