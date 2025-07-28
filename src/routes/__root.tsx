import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";
import type { TRPCRouter } from "@/server/router";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null
		: React.lazy(() =>
				import("@tanstack/react-router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "Modern Full-Stack Boilerplate",
				description:
					"A feature-rich, type-safe starter for building modern web applications with React, tRPC, Drizzle ORM, and more.",
				keywords:
					"React, TypeScript, tRPC, Drizzle ORM, TanStack, Full-Stack, Web Development, Boilerplate, SaaS, Starter, Tailwind CSS",
			}),
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "preload",
				crossOrigin: "anonymous",
				as: "font",
				href: "/fonts/Gilroy-Medium.woff2",
				type: "font/woff2",
			},
			{
				rel: "preload",
				crossOrigin: "anonymous",
				as: "font",
				href: "/fonts/Gilroy-Bold.woff2",
				type: "font/woff2",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/favicon/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon/favicon-16x16.png",
			},
			{ rel: "icon", href: "/favicon/favicon.ico" },
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
		],
	}),
	component: () => <RootDocument />,
	wrapInSuspense: true,
});

function RootDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				{/* <ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				> */}
				<Outlet />
				<Toaster />
				<TanStackRouterDevtools />
				<Scripts />
				{/* </ThemeProvider> */}
			</body>
		</html>
	);
}
