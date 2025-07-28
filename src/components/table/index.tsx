import type { Table as TableType } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { FrownIcon, Loader2Icon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { TablePagination } from "./table-pagination";

export function BaseTable<T>({
	table,
	loading = false,
	hasPagination = false,
}: {
	table: TableType<T>;
	loading?: boolean;
	hasPagination?: boolean;
}) {
	if (!loading && table.getRowModel().rows.length === 0) {
		return (
			<div className="w-1/2 m-auto p-4">
				<Alert variant="default">
					<FrownIcon size={22} />
					<AlertTitle>No data</AlertTitle>
				</Alert>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="rounded-sm min-h-[15vh] max-h-[50vh] relative pr-2">
				<Loader2Icon className="animate-spin" size={20} />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{hasPagination ? (
				<TablePagination
					count={table.getExpandedRowModel().rows.length}
					onPageChange={table.setPageIndex}
					onPageSizeChange={table.setPageSize}
					page={table.getState().pagination.pageIndex}
					perPageCount={table.getState().pagination.pageSize}
				/>
			) : null}
			<ScrollArea className="rounded-sm min-h-[15vh] max-h-[50vh] pr-2">
				<Table className="table-auto">
					<colgroup>
						{table.getFlatHeaders().map((header) => (
							<col
								key={header.id}
								style={{
									width: header.getSize(),
									...header.column.columnDef.meta?.header?.style,
								}}
							/>
						))}
					</colgroup>
					<TableHeader className="sticky top-0 z-30 bg-white">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										colSpan={header.colSpan}
										key={header.id}
										scope="col"
										style={header.column.columnDef.meta?.header?.style}
									>
										<div className="flex flex-row items-center gap-2">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</div>
									</TableHead>
								))}
								<TableHead />
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow
								className={row.depth > 0 ? "bg-gray-100/75" : ""}
								key={row.id}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										style={cell.column.columnDef.meta?.cell?.style}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
								<TableCell />
							</TableRow>
						))}
					</TableBody>
				</Table>
				<ScrollBar orientation="vertical" />
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}
