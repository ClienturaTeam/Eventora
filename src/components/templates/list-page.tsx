import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ListFilter, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { exportToCsv } from "@/lib/export";
import { PageHeader, type Crumb } from "@/components/ds/page-header";
import { DataTable, type Column, type RowAction } from "@/components/ds/data-table";
import { DatePicker, MultiSelect, SearchInput } from "@/components/ds/form-controls";
import { StatCard, type StatCardProps } from "@/components/ds/stat-card";

export interface ListPageProps<T extends { id: string }> {
  title: string;
  description: string;
  crumbs: Crumb[];
  columns: Column<T>[];
  rows: T[];
  searchKeys: (keyof T)[];
  statusKey?: keyof T | undefined;
  facet?: { label: string; key: keyof T; options: string[] } | undefined;
  stats?: StatCardProps[] | undefined;
  createLabel?: string | undefined;
  createTo?: string | undefined;
  onCreate?: () => void;
  headerActions?: ReactNode | undefined;
  rowActions?: RowAction<T>[] | undefined;
  onRowClick?: ((row: T) => void) | undefined;
  aside?: ReactNode | undefined;
  loading?: boolean | undefined;
  error?: boolean | undefined;
  selectable?: boolean | undefined;
}

const statusOptions = [
  "all",
  "active",
  "published",
  "draft",
  "pending",
  "in_review",
  "approved",
  "rejected",
  "closed",
  "suspended",
  "archived",
];

export function ListPageTemplate<T extends { id: string }>({
  title,
  description,
  crumbs,
  columns,
  rows,
  searchKeys,
  statusKey = "status" as keyof T,
  facet,
  stats,
  createLabel,
  createTo,
  onCreate,
  headerActions,
  rowActions,
  onRowClick,
  aside,
  loading,
  error,
  selectable = false,
}: ListPageProps<T>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [facetValues, setFacetValues] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sortMode, setSortMode] = useState("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let next = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      next = next.filter((row) =>
        searchKeys.some((key) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    if (status !== "all" && statusKey) {
      next = next.filter((row) => String(row[statusKey]) === status);
    }
    if (facet && facetValues.length) {
      next = next.filter((row) => facetValues.includes(String(row[facet.key])));
    }
    if (sortMode === "az") {
      const key = searchKeys[0] as keyof T;
      next = [...next].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
    }
    return next;
  }, [rows, query, status, statusKey, facet, facetValues, sortMode, searchKeys]);

  const activeFilters =
    (status !== "all" ? 1 : 0) + facetValues.length + (date ? 1 : 0) + (query ? 1 : 0);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setFacetValues([]);
    setDate(undefined);
    setSortMode("recent");
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        crumbs={crumbs}
        actions={
          <>
            <Button variant="outline" onClick={() => {
              const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-export';
              exportToCsv(filtered, filename);
              toast.success("Export downloaded successfully");
            }}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            {createLabel ? (
              createTo ? (
                <Button asChild>
                  <Link to={createTo}>
                    <Plus className="h-4 w-4" />
                    {createLabel}
                  </Link>
                </Button>
              ) : (
                <Button onClick={onCreate || (() => toast.info("Create form opens here"))}>
                  <Plus className="h-4 w-4" />
                  {createLabel}
                </Button>
              )
            ) : null}
            {headerActions}
          </>
        }
      />

      {stats?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} loading={loading} />
          ))}
        </div>
      ) : null}

      <div className="card-surface p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:flex-wrap">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="min-w-0 lg:w-80"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
            >
              <ListFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {activeFilters}
                </Badge>
              ) : null}
            </Button>
            <Select value={sortMode} onValueChange={setSortMode}>
              <SelectTrigger className="w-[150px]" aria-label="Sort records">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="az">Alphabetical</SelectItem>
                <SelectItem value="updated">Recently updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Status</p>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all"
                        ? "All statuses"
                        : option.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {facet ? (
              <MultiSelect
                label={facet.label}
                options={facet.options}
                value={facetValues}
                onChange={setFacetValues}
                placeholder={`Any ${facet.label.toLowerCase()}`}
              />
            ) : null}
            <DatePicker label="From date" date={date} onSelect={setDate} />
            <div className="flex items-end">
              <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                Reset filters
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" : undefined}>
        <DataTable
          columns={columns}
          rows={filtered}
          selectable={selectable}
          selected={selected}
          onSelectedChange={setSelected}
          rowActions={rowActions}
          onRowClick={onRowClick}
          loading={loading}
          error={error}
          emptyTitle="No matching records"
          emptyDescription="Try widening your filters or clearing the search query to see more results."
        />
        {aside}
      </div>
    </>
  );
}
