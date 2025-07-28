import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	type ColumnDef,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	CheckIcon,
	CloudUploadIcon,
	FileUpIcon,
	Paperclip,
	PlusIcon,
} from "lucide-react";
import Papa from "papaparse";
import { useState } from "react";
import { toast } from "sonner";
import { BaseTable } from "@/components/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FileInput,
	FileUploader,
	FileUploaderContent,
	FileUploaderItem,
} from "@/components/ui/file-upload";
import { AddCandidateDialog } from "@/features/candidates/add-candidate/ui/add-dialog";
import { useTRPC } from "@/lib/trpc/react";

export const Route = createFileRoute("/(app)/candidates/add")({
	component: BulkUploadPage,
});

function BulkUploadPage() {
	const [files, setFiles] = useState<File[] | null>(null);

	const [parsedData, setParsedData] = useState<any[]>([]);
	const [columns, setColumns] = useState<ColumnDef<any>[]>([]);

	const trpc = useTRPC();
	const client = useQueryClient();
	const router = useRouter();

	const handleFileUpload = (files: File[] | null) => {
		if (!files) return;

		setFiles(files);

		if (files.length === 0) {
			setParsedData([]);
			setColumns([]);

			return;
		}

		Papa.parse(files[0], {
			header: true,
			skipEmptyLines: true,
			complete: (result) => {
				if (result.errors.length > 0) {
					console.error("CSV Parse Error:", result.errors);
					return;
				}

				const rows = result.data;
				const cols: ColumnDef<any>[] = rows[0]
					? Object.keys(rows[0]).map((key) => ({
							accessorKey: key,
							header: key,
							cell: (info) => (
								<div className="overflow-hidden">{info.getValue()}</div>
							),
							meta: {
								header: {
									style: {
										width: "150px",
									},
								},
							},
						}))
					: [];

				setParsedData(rows);
				setColumns(cols);
			},
		});
	};

	const agency = useQuery(trpc.agency.get.queryOptions());

	const create = useMutation(
		trpc.candidate.create.mutationOptions({
			onSuccess: async () => {
				toast.success("Candidates imported successfully");
				await client.invalidateQueries({
					queryKey: trpc.candidate.getAll.queryKey(),
				});

				router.navigate({ to: "/candidates" });
			},
			onError: () => {
				toast.error("Failed importing candidates");
			},
		}),
	);

	const table = useReactTable({
		data: parsedData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const handleImport = () => {
		const candidates = parsedData.map((row) => ({
			agencyId: agency.data?.id,
			firstName: row.first_name,
			lastName: row.last_name,
			middleName: row.middle_name || null,
			dateOfBirth: new Date(row.date_of_birth),
			email: row.email,
			linkedinUrl: row.linkedin_url || null,
			isActive: row.available?.toString().toLowerCase() === "true",
		}));

		create.mutate(candidates);
	};

	return (
		<div className="container grid gap-4">
			<div className="flex justify-between">
				<h1 className="font-bold text-3xl">Upload candidates</h1>

				<div className="flex items-center justify-between">
					<div />
					<AddCandidateDialog>
						<Button>
							<PlusIcon />
							Add single candidate
						</Button>
					</AddCandidateDialog>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Bulk upload</CardTitle>
						<CardDescription>Easy upload your candidates.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="mt-2">
							<div className="flex items-center gap-2">
								<CheckIcon className="size-5 text-accent" />
								<span className="text-sm font-semibold">
									Download CSV template
								</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckIcon className="size-5 text-accent" />
								<span className="text-sm font-semibold">
									Fill in required fields
								</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckIcon className="size-5 text-accent" />
								<span className="text-sm font-semibold">
									Auto Sync with LinkedIN
								</span>
							</div>
						</div>
						<a
							className={buttonVariants()}
							href="/candidates_template.csv"
							download
						>
							Download template
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Upload the CSV Template </CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 py-4">
						<FileUploader
							value={files}
							onValueChange={handleFileUpload}
							dropzoneOptions={{
								maxFiles: 1,
								maxSize: 1024 * 1024 * 4,
								multiple: false,
								accept: {
									"text/csv": [".csv"],
									"text/plain": [".txt"],
								},
							}}
							className="relative bg-background rounded-lg p-2"
						>
							<FileInput className="max-w-72 m-auto outline-dashed outline-1 outline-gray-400">
								<div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
									<CloudUploadIcon className="size-8 m-auto" />
									<p className="mb-1 text-sm">
										<span className="font-semibold">Click to upload</span>
										&nbsp; or drag and drop
									</p>
									<p className="text-xs">.CSV or .TXT</p>
								</div>
							</FileInput>
							<FileUploaderContent className="mt-2">
								{files &&
									files.length > 0 &&
									files.map((file, i) => (
										<FileUploaderItem key={i} index={i}>
											<Paperclip className="size-4 stroke-current" />
											<span>{file.name}</span>
										</FileUploaderItem>
									))}
							</FileUploaderContent>
						</FileUploader>
					</CardContent>
				</Card>
			</div>

			{parsedData.length > 0 ? (
				<Card>
					<CardHeader>
						<div className="flex justify-between">
							<div>
								<CardTitle>CSV Preview</CardTitle>
								<CardDescription>{parsedData.length} rows</CardDescription>
							</div>
							<Button onClick={handleImport}>Import</Button>
						</div>
					</CardHeader>
					<CardContent className="relative">
						<BaseTable table={table} />
					</CardContent>
				</Card>
			) : null}

			{parsedData.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Bulk Upload Candidates explained</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="font-semibold">Step 1</span>
								<p className="">
									Fill in Required Candidate fields in CSV Template
								</p>
								<small>
									<strong>Field names:</strong> Name*, Middlename, Surname*,
									Mail*, Date of Birth
								</small>
							</div>

							<div>
								<span className="font-semibold">Step 2</span>
								<p className="">
									Autosync Candidate Profile with LinkedIN, CV (Bèta) or
									manually
								</p>
								<small>
									<strong>Field names:</strong> LinkedInUrl, CVname (Bèta)
								</small>
							</div>

							<div>
								<span className="font-semibold">Step 3</span>
								<p className="">
									CSV Template (optional): Fill in Matching & Schedule
									preferences
								</p>
								<small>
									<strong>Field names:</strong> Timezone UTC, BudgetMin,
									BudgetMax, Available, HoursMin, HoursMax
								</small>
							</div>

							<div>
								<span className="font-semibold">Step 4</span>
								<p className="">
									Bulk edit in your candidate dashboard & precise adjustment in
									candidate profile
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
