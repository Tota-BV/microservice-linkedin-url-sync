import { BaseTable } from "@/components/table";
import { Header } from "@/components/table/header";
import { buttonVariants } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc/react";
import type { TRPCRouter } from "@/server/router";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { DateTime } from "luxon";
import React from "react";

type RouterOutput = inferRouterOutputs<TRPCRouter>;

const columnHelper =
  createColumnHelper<RouterOutput["invoices"]["getAll"][number]>();

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const columns = [
  columnHelper.accessor("id", {
    id: "indicator-length",
    header: (info) => <Header column={info.column}>ID</Header>,
    cell: (info) => (
      <div>
        <a
          href={info.row.original.invoicePdf}
          target="_blank"
          className={buttonVariants({ variant: "link", size: "inline" })}
        >
          {info.getValue()}
        </a>
      </div>
    ),
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("date", {
    header: (info) => <Header column={info.column}>Date</Header>,
    cell: (info) => (
      <div>{DateTime.fromJSDate(info.getValue()).toFormat("dd-MM-yyyy")}</div>
    ),
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("amount", {
    header: (info) => <Header column={info.column}>Amount</Header>,
    cell: (info) => <div>{formatEuro(info.getValue())}</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("status", {
    header: (info) => <Header column={info.column}>Status</Header>,
    cell: (info) => <div>{info.getValue()}</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("type", {
    header: (info) => <Header column={info.column}>Type</Header>,
    cell: (info) => <div>{info.getValue()}</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  // columnHelper.display({
  //   id: "actions",
  //   header: (info) => <Header column={info.column}>Suggested Actions</Header>,
  //   cell: (info) => <div>...</div>,
  //   meta: {
  //     header: {
  //       style: {
  //         width: "100%",
  //       },
  //     },
  //   },
  // }),
];

export function InvoicesTable() {
  const trpc = useTRPC();

  const agency = useQuery(trpc.agency.getAgency.queryOptions());

  const invoices = useQuery(
    trpc.invoices.getAll.queryOptions(
      { agencyId: agency.data?.id },
      { enabled: Boolean(agency.data?.id) },
    ),
  );

  const table = useReactTable({
    data: invoices.data ?? [],
    columns: React.useMemo(() => columns, [columns]),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative">
      {/* <OverLayLoader loader={<ElooLoader scale={0.7} />} show={isFetching} /> */}
      <BaseTable
        table={table}
        loading={agency.isFetching || invoices.isFetching}
      />
    </div>
  );
}
