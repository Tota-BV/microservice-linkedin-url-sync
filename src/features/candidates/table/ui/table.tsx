import { BaseTable } from "@/components/table";
import { Header } from "@/components/table/header";
import { buttonVariants } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import type { TRPCRouter } from "@/server/router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import React from "react";

type RouterOutput = inferRouterOutputs<TRPCRouter>;

const columnHelper =
  createColumnHelper<RouterOutput["candidate"]["getAll"][number]>();

const columns = [
  columnHelper.accessor("name", {
    id: "indicator-length",
    header: (info) => <Header column={info.column}>Name</Header>,
    cell: (info) => (
      <div>
        <Link
          to="/candidates/$candidateId/profile"
          params={{ candidateId: info.row.original.id }}
          className={buttonVariants({ variant: "link", size: "inline" })}
        >
          {info.getValue()}
        </Link>
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
  columnHelper.accessor("profile.availability", {
    header: (info) => <Header column={info.column}>Availability</Header>,
    cell: (info) => <div>{info.getValue()}</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("verification", {
    header: (info) => <Header column={info.column}>Verification</Header>,
    cell: (info) => <div>Unverified</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.accessor("profile.profileStrength", {
    header: (info) => <Header column={info.column}>Profile strength</Header>,
    cell: (info) => <div>{info.getValue()}</div>,
    meta: {
      header: {
        style: {
          width: "100%",
        },
      },
    },
  }),
  columnHelper.display({
    id: "actions",
    header: (info) => <Header column={info.column}>Suggested Actions</Header>,
    cell: (info) => <div>...</div>,
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

  const agency = useQuery(trpc.agency.getAgency.queryOptions());

  const candidates = useQuery(
    trpc.candidate.getAll.queryOptions(
      { agencyId: agency.data?.id },
      { enabled: Boolean(agency.data?.id) },
    ),
  );

  console.log(candidates.data);

  const table = useReactTable({
    data: candidates.data ?? [],
    columns: React.useMemo(() => columns, [columns]),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative">
      {/* <OverLayLoader loader={<ElooLoader scale={0.7} />} show={isFetching} /> */}
      <BaseTable
        table={table}
        loading={agency.isFetching || candidates.isFetching}
      />
    </div>
  );
}
