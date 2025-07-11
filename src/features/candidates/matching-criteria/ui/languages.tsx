import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useParams, useRouter } from "@tanstack/react-router";
import { DeleteIcon, PencilIcon } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CountryPicker } from "@/features/register/ui/country-picker";
import { useTRPC } from "@/lib/trpc/react";
import { formatEuro } from "@/utils";
import type { UpdateCandidateMatchingCritera } from "../../model/schema";

export function Languages() {
	const { candidate } = useLoaderData({
		from: "/(app)/candidates/$candidateId",
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex justify-between">Languages</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<div>
					{candidate?.matchingCriteria.languages
						?.map((lan) => lan.value)
						.join(", ")}
				</div>
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
	const update = useMutation(
		trpc.candidateMatchingCriteria.update.mutationOptions(),
	);
	const form = useForm<UpdateCandidateMatchingCritera>({
		defaultValues: {
			languages: candidate?.matchingCriteria.languages,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "languages",
	});

	React.useEffect(() => {
		append({ value: "" });
	}, []);

	const onSubmit = async (values: UpdateCandidateMatchingCritera) => {
		await update.mutateAsync({ languages: values.languages, candidateId });
		await router.invalidate();

		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[600px]!">
				<DialogHeader>
					<DialogTitle>Edit Languages</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="flex flex-col gap-4">
							{fields.map((field, idx) => {
								return (
									<div key={field.id} className="flex items-center gap-2">
										<FormField
											control={form.control}
											name={`languages.${idx}.value`}
											render={({ field }) => (
												<FormItem className="grow">
													<FormLabel>Choose language</FormLabel>
													<FormControl>
														<CountryPicker
															fullWidth
															onChange={(c) => field.onChange(c?.name)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											variant="icon"
											size="icon"
											type="button"
											className="self-end mt-2"
											onClick={() => remove(idx)}
										>
											<DeleteIcon className="text-red-500" />
										</Button>
									</div>
								);
							})}
							<Button onClick={() => append({ value: "" })}>
								Add language
							</Button>
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
