import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useParams, useRouter } from "@tanstack/react-router";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { DatePicker } from "@/components/data-picker";
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
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import type { ExperienceType } from "../model/types";

export function Experience() {
	const { candidate } = useLoaderData({
		from: "/(app)/candidates/$candidateId",
	});

	return (
		<Card variant="ghost">
			<CardHeader className="flex items-center justify-between">
				<CardTitle className="flex justify-between">Experience</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PlusIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-6">
					{/* {candidate?.profile.experience?.map((exp) => {
            console.log(exp);
            return (
              <div key={exp.jobTitle} className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <span className="font-bold text-base">{exp.company}</span>
                      -<span>{exp.jobTitle}</span>
                    </div>
                    <div className="text-sm flex gap-4">
                      <span>
                        {DateTime.fromISO(exp.dates.from).toFormat("LLL-yyyy")}
                      </span>
                      <span>
                        {DateTime.fromISO(exp.dates.to).toFormat("LLL-yyyy")}
                      </span>
                    </div>
                  </div>
                  <EditSection experience={exp}>
                    <Button variant="icon" size="icon">
                      <PencilIcon />
                    </Button>
                  </EditSection>
                </div>
                <div className="flex gap-1">
                  {exp.skills.map((skill) => (
                    <Badge size="sm" key={skill.value} variant="secondary">
                      {skill.value}
                    </Badge>
                  ))}
                </div>
                <p className="whitespace-pre-line">{exp.decription}</p>
              </div>
            );
          })} */}
				</div>
			</CardContent>
		</Card>
	);
}

function EditSection({
	children,
	experience,
}: React.PropsWithChildren<{ experience?: ExperienceType }>) {
	const { candidateId } = useParams({
		from: "/(app)/candidates/$candidateId",
	});

	const [open, setOpen] = React.useState(false);
	const router = useRouter();

	const trpc = useTRPC();
	const update = useMutation(trpc.candidateProfile.update.mutationOptions());
	const form = useForm<ExperienceType>({
		defaultValues: experience,
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "skills",
	});

	const onSubmit = async (values: ExperienceType) => {
		// await update.mutateAsync({ experience: [values], candidateId });
		// await router.invalidate();
		// form.reset();
		// setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="w-[600px]">
				<DialogHeader>
					<DialogTitle>Candidate experience</DialogTitle>
					<DialogDescription> </DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<input type="hidden" {...form.register("id")} value={nanoid()} />

						<FormField
							control={form.control}
							name="company"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Company</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="jobTitle"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Job title</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="dates.from"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date from</FormLabel>
										<FormControl>
											<DatePicker fullWidth onChange={field.onChange} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="dates.to"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date to</FormLabel>
										<FormControl>
											<DatePicker fullWidth onChange={field.onChange} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-2">
							<FormLabel>Skills</FormLabel>
							<div
								className={cn(
									"flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
									"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
									"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
									"flex-wrap gap-2",
								)}
							>
								{fields.map((field, idx) => {
									return (
										<React.Fragment key={field.id}>
											<input
												type="hidden"
												{...form.register(`skills.${idx}.value`)}
											/>
											<Badge variant="secondary">
												{field.value}
												<Button
													variant="ghost"
													size="icon"
													className="ml-2 size-3"
													onClick={() => remove(idx)}
												>
													<XIcon className="w-3" />
												</Button>
											</Badge>
										</React.Fragment>
									);
								})}
								<input
									className="w-full bg-transparent outline-none"
									placeholder="Enter your skill and press enter"
									onKeyDown={(e) => {
										const value = (e.target as unknown as { value: string })
											.value;

										if (e.key === "Enter" || e.key === ",") {
											e.preventDefault();
											append({ value });
											(e.target as unknown as { value: string }).value = "";
										}
										if (e.key === "Backspace" && value.length === 0) {
											e.preventDefault();
											remove(fields.length - 1);
										}
									}}
								/>
							</div>
						</div>

						<FormField
							control={form.control}
							name="decription"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
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
						<DialogFooter className="pt-8">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button>Save</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
