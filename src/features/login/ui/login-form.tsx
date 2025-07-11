import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC } from "@/lib/trpc/react";
import { type LoginSchema, loginSchema } from "../model/schema";

export default function LoginForm() {
	const form = useForm({
		mode: "onSubmit",
		defaultValues: {
			email: "",
			password: "",
		},
		resolver: zodResolver(loginSchema),
	});

	const router = useRouter();
	const nav = useNavigate();
	const trpc = useTRPC();

	const login = useMutation(
		trpc.auth.login.mutationOptions({
			onSuccess: () => {
				nav({ to: "/" });
			},
		}),
	);

	async function onSubmit(data: LoginSchema) {
		await authClient.signIn.email(data);
		await router.invalidate();
	}

	return (
		<Form {...form}>
			{login.error ? (
				<Alert variant="destructive">
					<AlertDescription>{login.error.message}</AlertDescription>
				</Alert>
			) : null}
			<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
				<div className="grid gap-6">
					<div className="grid gap-3">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="mail@tota.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid gap-3">
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center">
										<FormLabel>Password</FormLabel>
										<Link
											to="/"
											className="ml-auto text-sm underline-offset-4 hover:underline"
										>
											Forgot your password?
										</Link>
									</div>
									<FormControl>
										<PasswordInput {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Button type="submit" className="w-full" disabled={login.isPending}>
						Login
					</Button>
				</div>
			</form>
		</Form>
	);
}
