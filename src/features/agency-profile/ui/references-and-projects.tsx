import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/react";
import type { UpdateAgencyProfile } from "../model/schema";

export function ReferencesAndProjects() {
	const { profile } = useLoaderData({ from: "/(app)/profile/" });

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex justify-between">
					References and Projects
				</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-6">
					{profile?.referencesAndProjects?.map((project) => {
						return (
							<div key={project.title} className="flex flex-col gap-2">
								<span className="font-bold text-base">{project.title}</span>
								<p className="whitespace-pre-line">{project.text}</p>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

function EditSection({ children }: React.PropsWithChildren) {
	const { profile } = useLoaderData({ from: "/(app)/profile/" });

	const [open, setOpen] = React.useState(false);
	const router = useRouter();

	const trpc = useTRPC();
	const update = useMutation(trpc.agency.updateProfile.mutationOptions());

	const form = useForm<UpdateAgencyProfile>({
		defaultValues: {
			referencesAndProjects: profile?.referencesAndProjects,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "referencesAndProjects",
		rules: { required: true },
	});

	React.useEffect(() => {
		append({ title: "", text: "" });
	}, []);

	const onSubmit = async (values: UpdateAgencyProfile) => {
		console.log(values);
		await update.mutateAsync(values);
		await router.invalidate();

		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[600px]!">
				<DialogHeader>
					<DialogTitle>Edit References and Projects</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4">
							{fields.map((field, idx) => {
								return (
									<div key={field.id} className="flex flex-col gap-4">
										<div className="flex items-center gap-2">
											<div className="text-sm text-white font-bold bg-primary rounded-full size-6 p-3 flex items-center justify-center">
												{idx + 1}
											</div>
											<Separator className="my-4 flex-1 bg-primary/25" />
										</div>
										<div>
											<FormField
												control={form.control}
												name={`referencesAndProjects.${idx}.title`}
												rules={{ required: true }}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Title</FormLabel>
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
											name={`referencesAndProjects.${idx}.text`}
											rules={{ required: true }}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Text</FormLabel>
													<FormControl>
														<Textarea {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
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
