import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ListFilter, Plus, RotateCcw } from "lucide-react";
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

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr == null) return undefined;
    curr = curr[part];
  }
  return curr;
}

export interface ListPageProps<T extends { id: string }> {
  title: string;
  description: string;
  crumbs: Crumb[];
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T | string)[];
  statusKey?: keyof T | string;
  statusOptions?: { label: string; value: string }[] | string[];
  dateKey?: keyof T | string;
  facet?: { label: string; key: keyof T | string; options: string[] };
  stats?: StatCardProps[];
  createLabel?: string;
  createTo?: string;
  onCreate?: () => void;
  headerActions?: ReactNode;
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T) => void;
  aside?: ReactNode;
  loading?: boolean;
  error?: boolean;
  selectable?: boolean;
  pageSize?: number;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
}

const DEFAULT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "registered", label: "Registered" },
  { value: "completed", label: "Completed" },
  { value: "in_review", label: "In Review" },
  { value: "submitted", label: "Submitted" },
  { value: "evaluated", label: "Evaluated" },
  { value: "active", label: "Active" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed", label: "Closed" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

export function ListPageTemplate<T extends { id: string }>({
  title,
  description,
  crumbs,
  columns,
  rows = [],
  searchKeys = [],
  statusKey = "status",
  statusOptions,
  dateKey = "createdAt",
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
  pageSize = 8,
  emptyTitle: customEmptyTitle,
  emptyDescription: customEmptyDescription,
}: ListPageProps<T>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [facetValues, setFacetValues] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sortMode, setSortMode] = useState("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Compute available status options dynamically from DEFAULT + rows
  const computedStatusOptions = useMemo(() => {
    if (statusOptions && statusOptions.length > 0) {
      return statusOptions.map((opt) =>
        typeof opt === "string"
          ? {
              value: opt.toLowerCase(),
              label: opt.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
            }
          : opt
      );
    }

    const list = [...DEFAULT_STATUS_OPTIONS];
    if (statusKey && rows && rows.length > 0) {
      const existingValues = new Set(list.map((o) => o.value.toLowerCase().replace(/[\s-]/g, "_")));
      rows.forEach((row: any) => {
        const raw = getNestedValue(row, statusKey as string);
        if (raw) {
          const norm = String(raw).toLowerCase().replace(/[\s-]/g, "_");
          if (!existingValues.has(norm)) {
            existingValues.add(norm);
            list.push({
              value: norm,
              label: String(raw).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
            });
          }
        }
      });
    }
    return list;
  }, [statusOptions, statusKey, rows]);

  // Combined filtering, searching, date checking, and sorting
  const filtered = useMemo(() => {
    let next = rows || [];

    // 1. Search Query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      next = next.filter((row: any) => {
        // Check explicit searchKeys
        if (searchKeys && searchKeys.length > 0) {
          const matched = searchKeys.some((key) => {
            const val = getNestedValue(row, key as string);
            return val != null && String(val).toLowerCase().includes(q);
          });
          if (matched) return true;
        }

        // Fallback to common fields
        const commonFields = [
          row.name,
          row.title,
          row.description,
          row.email,
          row.id,
          row.code,
          row.event?.name,
          row.event?.title,
          row.event?.description,
          row.team?.name,
          row.user?.firstName,
          row.user?.lastName,
          row.user?.email,
          row.submittedBy?.firstName,
          row.submittedBy?.lastName,
          row.submittedBy?.email,
          row.competition?.name,
          row.roleName,
        ];
        return commonFields.some(
          (val) => val != null && String(val).toLowerCase().includes(q)
        );
      });
    }

    // 2. Status Filter
    if (status !== "all" && statusKey) {
      const targetNorm = status.toLowerCase().replace(/[\s-]/g, "_");
      next = next.filter((row: any) => {
        const val = getNestedValue(row, statusKey as string);
        if (val == null) return false;
        const rowNorm = String(val).toLowerCase().replace(/[\s-]/g, "_");
        return rowNorm === targetNorm;
      });
    }

    // 3. Facet Filter
    if (facet && facetValues.length > 0) {
      const normTargets = facetValues.map((v) =>
        v.toLowerCase().replace(/[\s-]/g, "_")
      );
      next = next.filter((row: any) => {
        const val = getNestedValue(row, facet.key as string);
        if (val == null) return false;
        const normVal = String(val).toLowerCase().replace(/[\s-]/g, "_");
        return normTargets.includes(normVal);
      });
    }

    // 4. From Date Filter (Comparing actual timestamps at start of day)
    if (date) {
      const fromStartOfDay = new Date(date);
      fromStartOfDay.setHours(0, 0, 0, 0);
      const fromTime = fromStartOfDay.getTime();

      next = next.filter((row: any) => {
        const rawDate =
          getNestedValue(row, (dateKey as string) || "createdAt") ??
          row.createdAt ??
          row.registeredAt ??
          row.date ??
          row.startDate ??
          row.startTime ??
          row.submittedAt ??
          row.updatedAt;

        if (!rawDate) return false;
        const rowTime = new Date(rawDate).getTime();
        return !isNaN(rowTime) && rowTime >= fromTime;
      });
    }

    // 5. Sorting
    const getTime = (r: any) => {
      const raw =
        getNestedValue(r, (dateKey as string) || "createdAt") ??
        r.createdAt ??
        r.registeredAt ??
        r.date ??
        r.startDate ??
        r.startTime ??
        r.submittedAt ??
        r.updatedAt;
      return raw ? new Date(raw).getTime() : 0;
    };

    const getAlpha = (r: any) => {
      const primaryKey = searchKeys && searchKeys[0] ? (searchKeys[0] as string) : null;
      const primaryVal = primaryKey ? getNestedValue(r, primaryKey) : null;
      const fallbackVal =
        r.name ??
        r.title ??
        r.event?.name ??
        r.event?.title ??
        r.team?.name ??
        r.user?.firstName ??
        r.id ??
        "";
      return String(primaryVal ?? fallbackVal ?? "").toLowerCase();
    };

    if (sortMode === "recent") {
      next = [...next].sort((a, b) => getTime(b) - getTime(a));
    } else if (sortMode === "oldest") {
      next = [...next].sort((a, b) => getTime(a) - getTime(b));
    } else if (sortMode === "az") {
      next = [...next].sort((a, b) => getAlpha(a).localeCompare(getAlpha(b)));
    } else if (sortMode === "za") {
      next = [...next].sort((a, b) => getAlpha(b).localeCompare(getAlpha(a)));
    } else if (sortMode === "updated") {
      next = [...next].sort((a: any, b: any) => {
        const uA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const uB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return uB - uA;
      });
    }

    return next;
  }, [rows, query, status, statusKey, facet, facetValues, date, dateKey, sortMode, searchKeys]);

  const activeFilters =
    (status !== "all" ? 1 : 0) +
    facetValues.length +
    (date !== undefined ? 1 : 0) +
    (query.trim() !== "" ? 1 : 0);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setFacetValues([]);
    setDate(undefined);
    setSortMode("recent");
  };

  const isFiltersActive =
    query.trim() !== "" ||
    status !== "all" ||
    facetValues.length > 0 ||
    date !== undefined;

  const entityName = title.toLowerCase().replace(/^(my|managed)\s+/, "");

  const emptyTitle = customEmptyTitle || (isFiltersActive && rows.length > 0
    ? `No ${entityName} match your filters.`
    : `No ${entityName} found`);

  const emptyDescription = customEmptyDescription || (isFiltersActive && rows.length > 0
    ? "Try widening your filters or clearing the search query to see more results."
    : "Records will appear once data matching your filters exists.");

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        crumbs={crumbs}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                const filename =
                  title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-export";
                exportToCsv(filtered, filename);
                toast.success("Export downloaded successfully");
              }}
            >
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
              {activeFilters > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {activeFilters}
                </Badge>
              ) : null}
            </Button>
            <Select value={sortMode} onValueChange={setSortMode}>
              <SelectTrigger className="w-[160px]" aria-label="Sort records">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="az">A-Z</SelectItem>
                <SelectItem value="za">Z-A</SelectItem>
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
                  {computedStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                <RotateCcw className="h-4 w-4 mr-1.5" />
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
          pageSize={pageSize}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptyActionLabel={isFiltersActive && rows.length > 0 ? "Reset Filters" : undefined}
          onEmptyAction={isFiltersActive && rows.length > 0 ? reset : undefined}
        />
        {aside}
      </div>
    </>
  );
}
