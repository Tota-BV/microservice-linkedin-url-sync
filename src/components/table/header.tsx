import type { Column } from "@tanstack/react-table";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

export function Header<T,>({
  column,
  children,
  className,
}: PropsWithChildren<{
  column: Column<T>;
  className?: string;
}>) {
  return (
      <div
        className={cn("flex flex-row w-full items-center hover:cursor-pointer select-none gap-1 font-medium text-base text-gray-800 font-display", className)}
        onClick={column.getToggleSortingHandler()}
      >
        {children}
        {column.getCanSort()
          ? {
            desc: <ArrowDownIcon size={16} />,
            asc: <ArrowUpIcon size={16} />,
          }[column.getIsSorted() as string] ?? null
          : null}
      </div>
    );


}
