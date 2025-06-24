import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Updater } from "@tanstack/react-table";
export function TablePagination({
  count,
  page,
  perPageCount,
  onPageChange,
}: {
  count: number;
  page: number;
  perPageCount: number;
  onPageChange: (updater: Updater<number>) => void;
  onPageSizeChange: (updater: Updater<number>) => void;
}) {
  const totalPages = Math.ceil(count / perPageCount);
  const visiblePageCount = 10;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    const half = Math.floor(visiblePageCount / 2);
    let start = Math.max(2, page - half);
    let end = Math.min(totalPages - 1, page + half);

    if (end - start + 1 < visiblePageCount) {
      const shortage = visiblePageCount - (end - start + 1);
      if (start > 2) {
        start = Math.max(2, start - shortage);
      } else if (end < totalPages - 1) {
        end = Math.min(totalPages - 1, end + shortage);
      }
    }

    pages.push(1);

    if (start > 2) pages.push("start-ellipsis");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("end-ellipsis");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <Pagination className="gap-4 justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page < 1}
            onClick={() => onPageChange(page - 1)}
            size="sm"
          />
        </PaginationItem>
        {getVisiblePages().map((p, idx) => (
          <PaginationItem key={idx}>
            {p === "start-ellipsis" || p === "end-ellipsis" ? (
              <PaginationEllipsis />
            ) : typeof p === "number" ? (
              <PaginationLink
                isActive={page + 1 === p}
                onClick={() => onPageChange(p - 1)}
                size="sm"
              >
                {p}
              </PaginationLink>
            ) : null}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            size="sm"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
