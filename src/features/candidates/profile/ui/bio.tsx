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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/react";
import type { UpdateCandidate } from "../../model/schema";

export function Bio() {
	const { candidate } = useLoaderData({
		from: "/(app)/candidates/$candidateId",
	});

	return (
		<Card variant="ghost">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex justify-between">Bio</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<p className="whitespace-pre-line">
					{candidate?.bio || "here goes summary"}
				</p>
			</CardContent>
		</Card>
	);
}

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
	const update = useMutation(trpc.candidate.update.mutationOptions());
	const form = useForm({
		defaultValues: {
			bio: candidate?.bio ?? "",
		},
	});

	const onSubmit = async (values: UpdateCandidate) => {
		await update.mutateAsync({ ...values, id: candidateId });
		await router.invalidate();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[600px]!">
				<DialogHeader>
					<DialogTitle>Edit bio</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div>
							<FormField
								control={form.control}
								name="bio"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Textarea
												{...field}
												className="min-h-30 max-h-72"
												rows={25}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
