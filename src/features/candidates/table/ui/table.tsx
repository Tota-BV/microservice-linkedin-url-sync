import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import { BaseTable } from "@/components/table";
import { Header } from "@/components/table/header";
import { buttonVariants } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc/react";
import type { TRPCRouter } from "@/server/router";

type RouterOutput = inferRouterOutputs<TRPCRouter>;

const columnHelper = createColumnHelper<RouterOutput["candidate"]["getOne"]>();

const columns = [
	columnHelper.display({
		id: "indicator-length",
		header: (info) => <Header column={info.column}>Name</Header>,
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
		meta: {
			header: {
				style: {
					width: "100%",
				},
			},
		},
	}),
	columnHelper.accessor("email", {
		header: (info) => <Header column={info.column}>Email</Header>,
		cell: (info) => <div>{info.getValue()}</div>,
		meta: {
			header: {
				style: {
					width: "100%",
				},
			},
		},
	}),
	columnHelper.accessor("generalJobTitle", {
		header: (info) => <Header column={info.column}>Job title</Header>,
		cell: (info) => <div>{info.getValue()}</div>,
		meta: {
			header: {
				style: {
					width: "100%",
				},
			},
		},
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
	});

	return (
		<div className="relative">
			<BaseTable
				table={table}
				loading={agency.isFetching || candidates.isFetching}
			/>
		</div>
	);
}
