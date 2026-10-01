import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, TableSkeleton } from "./states";
import { DataPagination } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  className?: string | undefined;
  sortable?: boolean | undefined;
  render?: (row: T) => ReactNode | undefined;
  value?: (row: T) => string | number | undefined;
}

export interface RowAction<T> {
  label: string;
  onSelect: (row: T) => void;
  isVisible?: (row: T) => boolean;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  selectable?: boolean | undefined;
  selected?: string[] | undefined;
  onSelectedChange?: ((ids: string[]) => void) | undefined;
  headerCheckboxLabel?: string | undefined;
  rowActions?: RowAction<T>[] | undefined;
  loading?: boolean | undefined;
  error?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  emptyActionLabel?: string | undefined;
  onEmptyAction?: (() => void) | undefined;
  pageSize?: number | undefined;
  onRowClick?: ((row: T) => void) | undefined;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectable = false,
  selected = [],
  onSelectedChange,
  headerCheckboxLabel,
  rowActions,
  loading,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records will appear once data matching your filters exists.",
  emptyActionLabel,
  onEmptyAction,
  pageSize = 8,
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  // Reset page to 1 whenever rows change (filtering, sorting, search)
  useMemo(() => {
    setPage(1);
  }, [rows]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const get = (row: T) =>
      col?.value ? col.value(row) : ((row as Record<string, unknown>)[sort.key] as string | number);
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === "number" && typeof bv === "number")
        return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const paged = sorted.slice((current - 1) * pageSize, current * pageSize);
  const allPagedSelected = paged.length > 0 && paged.every((r) => selected.includes(r.id));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allPagedSelected ? [] : paged.map((r) => r.id));
  };

  const toggleRow = (id: string) => {
    if (!onSelectedChange) return;
    onSelectedChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key ? (prev.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );

  if (error) {
    return (
      <div className="card-surface overflow-hidden">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card-surface overflow-hidden">
        <TableSkeleton cols={columns.length} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card-surface overflow-hidden">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {selectable ? (
                <TableHead className={headerCheckboxLabel ? "whitespace-nowrap px-3" : "w-10"}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allPagedSelected}
                      onCheckedChange={toggleAll}
                      aria-label={headerCheckboxLabel || "Select All Visible"}
                      title={headerCheckboxLabel || "Select All Visible"}
                    />
                    {headerCheckboxLabel ? (
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {headerCheckboxLabel}
                      </span>
                    ) : null}
                  </div>
                </TableHead>
              ) : null}
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("whitespace-nowrap", col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {col.header}
                    </span>
                  )}
                </TableHead>
              ))}
              {rowActions?.length ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((row) => (
              <TableRow
                key={row.id}
                data-state={selected.includes(row.id) ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable ? (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onCheckedChange={() => toggleRow(row.id)}
                      aria-label={`Select row ${row.id}`}
                    />
                  </TableCell>
                ) : null}
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn("text-sm", col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </TableCell>
                ))}
                {rowActions?.length ? (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Row actions"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions.map((action) => {
                          const visible = action.isVisible ? action.isVisible(row) : true;
                          if (!visible) return null;
                          return (
                            <DropdownMenuItem
                              key={action.label}
                              onSelect={() => action.onSelect(row)}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        page={current}
        totalPages={totalPages}
        totalItems={sorted.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
