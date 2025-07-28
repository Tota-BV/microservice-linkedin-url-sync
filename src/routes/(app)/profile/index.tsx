import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AgencyDetails } from "@/features/agency-profile/ui/agency-details";
import { Overview } from "@/features/agency-profile/ui/overview";
import { ReferencesAndProjects } from "@/features/agency-profile/ui/references-and-projects";
import { Skills } from "@/features/agency-profile/ui/skills";
import { VerificationAndComplaince } from "@/features/agency-profile/ui/verification-and-complaince";

export const Route = createFileRoute("/(app)/profile/")({
	component: RouteComponent,
	loader: async ({ context: { queryClient, trpc } }) => {
		const agency = await queryClient.fetchQuery(trpc.agency.get.queryOptions());

		const profile = await queryClient.fetchQuery(
			trpc.agencyProfile.getProfile.queryOptions(),
		);

		// const candidates = await queryClient.ensureQueryData(
		// 	trpc.candidate.getAll.queryOptions({ agencyId: agency.id }),
		// );

		return {
			agency,
			profile,
			candidates: [],
		};
	},
});

function RouteComponent() {
	const { agency, profile, candidates } = Route.useLoaderData();

	return (
		<div className="h-full">
			<div className="rounded-xl overflow-hidden">
				<img
					src="/agency-profile.webp"
					className="h-52 w-full object-cover"
					alt="profile"
				/>
			</div>
			<div className="h-full bg-background">
				<div className="container grid gap24">
					<div className="flex justify-between">
						<div className="-mt-15 z-10 size-30">
							<Avatar>
								<AvatarImage
									className="rounded-lg border-4 border-white"
									src="https://github.com/julianklumpers.png"
								/>
								<AvatarFallback>UN</AvatarFallback>
							</Avatar>
						</div>
					</div>

					<div className="grid grid-cols-12">
						<div className="col-span-8 flex flex-col gap-10">
							<AgencyDetails />
							<div className="mt-auto flex gap-4">
								<div className="flex items-center gap-2">
									<MapPinIcon size={16} />
									<span className="text-gray-500 text-sm">
										{`${profile?.agency.city}, ${profile?.agency.country.name}`}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<CalendarDaysIcon size={16} />
									<span className="text-gray-500 text-sm">
										founded April 2022
									</span>
								</div>
							</div>
						</div>

						<div className="col-span-4 flex flex-col items-end justify-between gap-8">
							<div className="flex flex-col">
								<div className="flex items-center text-sm">
									<span>0 Reviews (average: 0.0/5.0)</span>
								</div>
							</div>
						</div>
					</div>

					<Separator className="bg-gray-400/50" />

					<div className="grid grid-cols-12 gap-8">
						<div className="col-span-8 flex flex-col gap-4">
							<Overview />
							<Skills />
							<VerificationAndComplaince />
							<ReferencesAndProjects />
						</div>

						<div className="col-span-4 flex flex-col gap-4">
							<Card variant="ghost">
								<CardHeader>
									<CardTitle className="flex justify-between">
										Office locations
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-2">
									<div className="flex flex-col">
										<span className="font-bold">Rotterdam, Netherlands</span>
										<span className="text-gray-600 text-sm">
											15:30 pm GMT+1 Primary location
										</span>
									</div>
								</CardContent>
							</Card>

							<Card variant="ghost">
								<CardHeader>
									<CardTitle className="flex justify-between">
										Laguages
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-2">
									<div className="flex flex-col">
										<span className="font-bold">Dutch</span>
										<span className="text-gray-600 text-sm">Native</span>
									</div>
									<div className="flex flex-col">
										<span className="font-bold">English</span>
										<span className="text-sm text-gray-600">
											Fluent, Intermediate
										</span>
									</div>
								</CardContent>
							</Card>

							<Card variant="ghost">
								<CardHeader>
									<CardTitle>Agency information</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-2">
									<div className="flex flex-col">
										<span className="text-gray-600 text-sm">
											Candidates on Tota
										</span>
										<span className="font-bold">
											{candidates.length}{" "}
											{candidates.length === 1 ? "candidate" : "candidates"}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-gray-600 text-sm">Tota tokens</span>
										<span className="font-bold">
											{agency?.tokens?.tokenCount ?? 0}
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
