import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import {
	Building2Icon,
	LandmarkIcon,
	PencilIcon,
	ScanEyeIcon,
	ShieldCheckIcon,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/react";
import type { Document } from "../model/types";

const documents: Document[] = [
	{
		id: "business-registration",
		title: "Business registration",
		icon: <Building2Icon size={28} />,
	},
	{
		id: "bank-account",
		title: "Bank account",
		icon: <LandmarkIcon size={28} />,
	},
	{
		id: "customer-screening",
		title: "Customer screening",
		icon: <ScanEyeIcon size={28} />,
	},
	{
		id: "tax-verification",
		title: "Tax verification",
		icon: <ShieldCheckIcon size={28} />,
	},
];

export function VerificationAndComplaince() {
	const { agency, profile } = useLoaderData({ from: "/(app)/profile/" });

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle className="flex justify-between">
					Verification & Compliance
				</CardTitle>
				<EditDialog>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditDialog>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					{documents.map((doc) => {
						const uploadedDoc = agency?.documents.find(
							(d) => d.type === doc.id,
						);

						return (
							<div
								key={doc.id}
								className="flex items-center space-x-4 border rounded-xl p-4 shadow-sm"
							>
								{doc.icon}
								<div className="flex-1 flex gap-2">
									<div>
										<div className="font-medium">
											{uploadedDoc ? uploadedDoc.name : doc.title}
										</div>
										<p className="text-sm">
											Lorem ipsum dolor sit amet consectetur adipisicing elit.
											Nam, eius optio eos accusantium rem eligendi, alias
											possimus sunt quis ad voluptates dicta dolorum, molestias
											debitis ex fuga deleniti similique praesentium?
										</p>
									</div>
									<div className="text-sm text-gray-600 flex items-center">
										<Badge className="bg-yellow-500/20 text-sm">
											<span className="text-yellow-700">
												{uploadedDoc ? uploadedDoc.status : "Not submitted"}
											</span>
										</Badge>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

function EditDialog({ children }: React.PropsWithChildren) {
	const [open, setOpen] = React.useState(false);
	const router = useRouter();

	const trpc = useTRPC();
	const upload = useMutation(trpc.agency.uploadDocuments.mutationOptions());
	const form = useForm({});

	const onSubmit = async (values: any) => {
		const formData = new FormData();

		documents.forEach((doc) => {
			if (values[doc.id]) {
				formData.append(doc.id, values[doc.id]);
			}
		});

		await upload.mutateAsync(formData);
		await router.invalidate();

		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[700px]!">
				<DialogHeader>
					<DialogTitle>Verification & Complaince</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-12 gap-4">
							{documents.map((doc) => {
								return (
									<FormField
										key={doc.id}
										control={form.control}
										name={doc.id}
										render={({ field }) => {
											return (
												<FormItem className="col-span-3">
													<FormLabel>{doc.title}</FormLabel>
													<FormControl>
														<label
															htmlFor={doc.id}
															className="relative flex h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dotted bg-gray-50 hover:bg-gray-100"
														>
															<Input
																{...field}
																id={doc.id}
																type="file"
																className="hidden"
																value={field.value?.fileName}
																onChange={(event) => {
																	if (event.target.files) {
																		field.onChange(event.target.files[0]);
																	}
																}}
															/>
															{doc.icon}
															<p className="text-center text-gray-500 text-xs">
																{field.value
																	? field.value?.name
																	: "Click to add a file"}
															</p>
														</label>
													</FormControl>
												</FormItem>
											);
										}}
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
