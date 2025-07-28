import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
	Calendar1Icon,
	CodeIcon,
	MapIcon,
	MapPinIcon,
	PinIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/(app)/candidates/$candidateId")({
	component: RouteComponent,
	loader: async ({ context: { queryClient, trpc }, params }) => {
		const candidate = await queryClient.fetchQuery(
			trpc.candidate.getOne.queryOptions({ candidateId: params.candidateId }),
		);

		return { candidate };
	},
});

function RouteComponent() {
	const { candidate } = Route.useLoaderData();

	const nav = useNavigate();

	return (
		<div className="h-full">
			<div>
				<img
					src="/agency-profile.webp"
					className="h-52 w-full object-cover"
					alt="profile"
				/>
			</div>
			<div className="h-full bg-background">
				<div className="container grid gap-4">
					<div className="grid grid-cols-12 gap-10">
						<div className="col-span-12 flex gap-6">
							<div>
								<div className="relative -mt-25 flex flex-col items-center gap-4">
									<Avatar className="size-50 border-4 border-white">
										<AvatarImage
											className="rounded-xl"
											src="https://github.com/shadcn.png"
										/>
										<AvatarFallback>UN</AvatarFallback>
									</Avatar>
									<div className="flex">
										<span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium text-sm">
											{`${candidate?.firstName} is available for hire`}
										</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col justify-self-start flex-1 pt-4 gap-4">
								<div>
									<h1 className="font-bold text-3xl text-gray-900 flex items-center gap-2">
										{`${candidate?.firstName} ${candidate?.middleName ?? ""} ${candidate?.lastName}`}
									</h1>
									<span className="flex items-center gap-2 text-green-700">
										<ShieldCheckIcon size={20} />
										Verified expert
									</span>
								</div>
								<div className="space-y-2">
									<div className="flex gap-2">
										<CodeIcon size={20} />
										<span>{candidate?.generalJobTitle}</span>
									</div>
									<div className="flex gap-2">
										<MapPinIcon size={20} />
										<span>De Lier, ZH, Netherlands</span>
									</div>
									<div className="flex gap-2">
										<Calendar1Icon size={20} />
										<span>member since February 27, 2025</span>
									</div>
								</div>
							</div>
						</div>

						<div className="col-span-8 flex flex-col gap-10">
							<div className="mt-auto flex gap-4">
								<Tabs
									defaultValue="profile"
									onValueChange={(value) => {
										const val = value as "profile" | "matching-criteria";
										nav({ to: `/candidates/$candidateId/${val}` });
									}}
								>
									<TabsList>
										<TabsTrigger value="profile">Profile</TabsTrigger>
										<TabsTrigger value="matching-criteria">
											Matching criteria
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						</div>
						<div className="col-span-4 flex flex-col items-end justify-between gap-8">
							<div className="flex flex-col">
								<Button>Verify your candidate</Button>
							</div>
						</div>
					</div>
					<Separator className="bg-gray-400/50" />
					<Outlet />
				</div>
			</div>
		</div>
	);
}
