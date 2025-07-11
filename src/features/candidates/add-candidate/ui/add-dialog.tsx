import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Combobox } from "@/components/combobox";
import { DatePicker } from "@/components/data-picker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
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
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/react";
import type { CreateCandidate } from "../../model/schema";

export function AddCandidateDialog({ children }: React.PropsWithChildren) {
	const [open, setOpen] = React.useState(false);

	const trpc = useTRPC();
	const client = useQueryClient();
	const form = useForm<CreateCandidate>();

	const agency = useQuery(trpc.agency.get.queryOptions());

	const create = useMutation(
		trpc.candidate.create.mutationOptions({
			onSuccess: async () => {
				toast.success("Candidate added successfully");

				await client.invalidateQueries({
					queryKey: trpc.candidate.getAll.queryKey(),
				});

				setOpen(false);
			},
			onError: () => {
				toast.error("Failed to add candidate");
			},
		}),
	);

	const onSubmit = (values: CreateCandidate) => {
		if (agency.data) {
			create.mutate({ ...values, agencyId: agency.data.id });
		}
	};

	const data = [
		{
			id: "Frontend developer",
			name: "Frontend developer",
		},
		{ id: "Backend developer", name: "Backend developer" },
		{
			id: "Fullstack developer",
			name: "Fullstack developer",
		},
	];

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[700px]!">
				<DialogHeader>
					<DialogTitle>Add new candidate</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Surname</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="generalJobTitle"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Job title</FormLabel>
									<FormControl>
										<Combobox
											fullWidth
											data={data}
											value={data.find((v) => v.id === field.value)}
											onChange={(val) => {
												field.onChange(val?.id);
											}}
											name={field.name}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="linkedinUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>LinkedIn</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="dateOfBirth"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date of Birth</FormLabel>
									<FormControl>
										<DatePicker
											fullWidth
											onChange={(date) => {
												field.onChange(date);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="pt-4">
							<div className="flex w-full flex-col gap-2">
								<Button
									type="submit"
									disabled={form.formState.isSubmitting}
									className="flex-1"
								>
									{form.formState.isSubmitting ? "Adding..." : "Add Candidate"}
								</Button>
								<DialogClose asChild>
									<Button variant="link">Cancel</Button>
								</DialogClose>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
