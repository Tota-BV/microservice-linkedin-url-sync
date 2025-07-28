import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import React from "react";
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
import MultipleSelector from "@/components/ui/multi-select";
import { useTRPC } from "@/lib/trpc/react";

export function Skills() {
	const { candidateId } = useParams({
		from: "/(app)/candidates/$candidateId",
	});

	const trpc = useTRPC();
	const candidateSkills = useQuery(
		trpc.skills.getManyByCandidateId.queryOptions({ candidateId }),
	);

	return (
		<Card variant="ghost">
			<CardHeader className="flex items-center justify-between">
				<CardTitle className="flex justify-between">Skills</CardTitle>
				<EditSection>
					<Button variant="icon" size="icon">
						<PencilIcon />
					</Button>
				</EditSection>
			</CardHeader>
			<CardContent>
				<div className="flex gap-1 flex-wrap">
					{candidateSkills.data?.map(({ skill }) => (
						<Badge variant="secondary" key={skill.id}>
							{skill.name}
						</Badge>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function EditSection({ children }: React.PropsWithChildren) {
	const { candidateId } = useParams({
		from: "/(app)/candidates/$candidateId",
	});

	const [open, setOpen] = React.useState(false);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const skills = useSuspenseQuery(trpc.skills.getMany.queryOptions());
	const candidateSkills = useSuspenseQuery(
		trpc.skills.getManyByCandidateId.queryOptions(
			{ candidateId },
			{ select: (data) => data.map((s) => s.skill) },
		),
	);
	const update = useMutation(trpc.skills.update.mutationOptions());

	const [values, setValues] = React.useState(candidateSkills.data ?? []);

	const onSubmit = async () => {
		await update.mutateAsync(
			values.map((skill) => ({
				candidateId,
				skillId: skill.id,
			})),
		);
		await queryClient.invalidateQueries({
			queryKey: trpc.skills.getManyByCandidateId.queryKey(),
		});
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="w-[600px]">
				<DialogHeader>
					<DialogTitle>Candidate skills</DialogTitle>
					<DialogDescription>
						Define your candidates skills below.
					</DialogDescription>
				</DialogHeader>

				<MultipleSelector
					options={skills.data.map((s) => ({
						label: s.name,
						value: s.id,
					}))}
					value={values.map((f) => ({
						label: f.name,
						value: f.id,
					}))}
					onChange={(values) => {
						setValues(
							skills.data.filter((s) => values.find((v) => v.value === s.id)),
						);
					}}
					className="w-full"
				/>
				<DialogFooter className="pt-8">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button onClick={onSubmit} type="submit">
						Save
					</Button>
				</DialogFooter>

				{/* <form onSubmit={form.handleSubmit(onSubmit)}>
						<div
							className={cn(
								"flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
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
								className="bg-transparent outline-none"
								// biome-ignore lint/a11y/noAutofocus: <explanation>
								autoFocus
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
						<DialogFooter className="pt-8">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button>Save</Button>
						</DialogFooter>
					</form> */}
			</DialogContent>
		</Dialog>
	);
}
