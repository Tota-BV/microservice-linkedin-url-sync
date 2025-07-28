import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useParams, useRouter } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/react";
import type { UpdateCandidateMatchingCritera } from "../../model/schema";
import type { AvailabilityType } from "../../profile/model/types";

export function Availabillty() {
	const { candidate } = useLoaderData({
		from: "/(app)/candidates/$candidateId",
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex justify-between">Availabillty</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "125px 1fr",
						gap: "8px 4px",
					}}
				>
					{Object.entries(candidate?.matchingCriteria.availability ?? {}).map(
						([day, time]) => (
							<React.Fragment key={day}>
								<div>{day}:</div>
								<div>
									{time.from} - {time.to}
								</div>
							</React.Fragment>
						),
					)}
				</div>
			</CardContent>
		</Card>
	);
}

const days: (keyof AvailabilityType)[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	// "saturday",
	// "sunday",
];

function EditSection({ children }: React.PropsWithChildren) {
	const { candidate } = useLoaderData({
		from: "/(app)/candidates/$candidateId",
	});
	const { candidateId } = useParams({
		from: "/(app)/candidates/$candidateId",
	});

	const [open, setOpen] = React.useState(false);
	const router = useRouter();

	const trpc = useTRPC();
	const update = useMutation(
		trpc.candidateMatchingCriteria.update.mutationOptions(),
	);
	const form = useForm<UpdateCandidateMatchingCritera>({
		defaultValues: {
			availability: candidate?.matchingCriteria.availability ?? {},
		},
	});

	const onSubmit = async (values: UpdateCandidateMatchingCritera) => {
		await update.mutateAsync({ ...values, candidateId });
		await router.invalidate();

		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[600px]!">
				<DialogHeader>
					<DialogTitle>Edit agency summary</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="space-y-4">
							{days.map((day) => {
								return (
									<FormField
										key={day}
										control={form.control}
										name={`availability.${day}`}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<div className="flex items-center gap-2">
														<div className="w-1/2">
															<span>{day}: </span>
														</div>
														<Input
															type="time"
															id="time-picker"
															step="1"
															defaultValue="09:00:00"
															onBlur={(e) =>
																field.onChange({
																	...field.value,
																	from: e.target.value,
																})
															}
															className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
														/>
														<Input
															type="time"
															id="time-picker"
															step="1"
															defaultValue="17:00:00"
															onBlur={(e) =>
																field.onChange({
																	...field.value,
																	to: e.target.value,
																})
															}
															className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								);
							})}
						</div>
						<DialogFooter className="pt-8">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button type="submit">Save</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
