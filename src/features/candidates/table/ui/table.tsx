import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { Text } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { DataTable } from "@/components/data-table/data-table";
import {
	DataTableActionBar,
	DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc/react";
import type { TRPCRouter } from "@/server/router";
import { BulkEditMatchingCriteria } from "../../bulk-edit/ui/matching-criteria";

type RouterOutput = inferRouterOutputs<TRPCRouter>;

const columnHelper = createColumnHelper<RouterOutput["candidate"]["getOne"]>();

const columns = [
	columnHelper.display({
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
				className="translate-y-0.5"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				className="translate-y-0.5"
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 40,
	}),
	columnHelper.accessor("firstName", {
		header: (info) => (
			<DataTableColumnHeader column={info.column} title="Name" />
		),
		cell: (info) => {
			if (!info.row.original?.id) return null;

			return (
				<div>
					<Link
						to="/candidates/$candidateId/profile"
						params={{ candidateId: info.row.original.id }}
						className={buttonVariants({ variant: "link", size: "inline" })}
					>
						{`${info.row.original.firstName} ${info.row.original.middleName ?? ""} ${info.row.original.lastName}`}
					</Link>
				</div>
			);
		},
		enableColumnFilter: true,
		meta: {
			label: "Name",
			placeholder: "Search candidate...",
			variant: "text",
			icon: Text,
			header: {
				style: {
					width: "20%",
				},
			},
		},
	}),
	columnHelper.accessor("email", {
		header: (info) => (
			<DataTableColumnHeader column={info.column} title="Email" />
		),
		cell: (info) => <div>{info.getValue()}</div>,
		meta: {
			header: {
				style: {
					width: "20%",
				},
			},
		},
	}),
	columnHelper.accessor("generalJobTitle", {
		header: (info) => (
			<DataTableColumnHeader column={info.column} title="Job title" />
		),
		cell: (info) => <div>{info.getValue()}</div>,
	}),
	columnHelper.accessor("updatedAt", {
		header: (info) => (
			<DataTableColumnHeader column={info.column} title="Last updated" />
		),
		cell: (info) => (
			<div>{DateTime.fromJSDate(info.getValue()).toFormat("dd LLLL yyyy")}</div>
		),
	}),
];

export function CandidateTable() {
	const trpc = useTRPC();

	const agency = useSuspenseQuery(trpc.agency.get.queryOptions());

	const candidates = useQuery(
		trpc.candidate.getAll.queryOptions(
			{ agencyId: agency.data.id },
			{ enabled: Boolean(agency.data?.id) },
		),
	);

	const table = useReactTable({
		data: candidates.data ?? [],
		columns: React.useMemo(() => columns, [columns]),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const rows = table.getFilteredSelectedRowModel().rows;

	console.log(rows);

	return (
		<div className="relative">
			<DataTable
				table={table}
				actionBar={
					<DataTableActionBar table={table}>
						<DataTableActionBarSelection table={table} />
						<Separator
							orientation="vertical"
							className="hidden data-[orientation=vertical]:h-5 sm:block"
						/>
						<BulkEditMatchingCriteria>
							<Button size="sm" variant="secondary">
								Change availability
							</Button>
						</BulkEditMatchingCriteria>
						<Button size="sm" variant="secondary">
							Copy Email(s) to clipboard
						</Button>
						<Button size="sm" variant="secondary">
							Send verification
						</Button>
					</DataTableActionBar>
				}
			>
				<DataTableToolbar table={table}>
					<DataTableSortList table={table} />
				</DataTableToolbar>
			</DataTable>
		</div>
	);
}
