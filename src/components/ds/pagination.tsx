import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }).map((_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-3.5 sm:px-4 py-3">
      <p className="min-w-0 text-center sm:text-left text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span> records
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {visible.map((p, idx) => (
            <span key={p} className="flex items-center">
              {idx > 0 && p - (visible[idx - 1] as number) > 1 ? (
                <span className="px-0.5 text-xs text-muted-foreground">…</span>
              ) : null}
              <Button
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className={cn("h-8 w-8 text-xs tabular-nums")}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
