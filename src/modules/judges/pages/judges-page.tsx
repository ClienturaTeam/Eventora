import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/ds/data-table";
import { useJudges, ApiJudge } from "../services/judges.api";

const columns: Column<ApiJudge & { _displayName: string; _assigned: number; _completed: number; _avgScore: number }>[] = [
  {
    key: "_displayName" as any,
    header: "Judge",
    sortable: true,
    render: (row) => <span className="font-medium">{(row as any)._displayName}</span>,
  },
  {
    key: "expertise" as any,
    header: "Expertise",
    sortable: true,
    render: (row) => row.expertise ? <Badge variant="outline">{row.expertise}</Badge> : <span className="text-muted-foreground">—</span>,
  },
  {
    key: "_assigned" as any,
    header: "Assigned",
    sortable: true,
    render: (row) => <span className="tabular-nums">{(row as any)._assigned}</span>,
  },
  {
    key: "_completed" as any,
    header: "Progress",
    sortable: true,
    render: (row) => {
      const pct =
        (row as any)._assigned > 0
          ? Math.round(((row as any)._completed / (row as any)._assigned) * 100)
          : 0;
      return (
        <div className="flex items-center gap-2 w-32">
          <Progress value={pct} className="h-1.5" />
          <span className="text-xs tabular-nums">{pct}%</span>
        </div>
      );
    },
  },
  {
    key: "_avgScore" as any,
    header: "Avg Score",
    sortable: true,
    render: (row) => (
      <span className="tabular-nums font-medium">
        {(row as any)._avgScore > 0 ? (row as any)._avgScore : "—"}
      </span>
    ),
  },
  {
    key: "competitions" as any,
    header: "Competitions",
    render: (row) => (
      <span className="tabular-nums text-muted-foreground">
        {row.competitions?.length ?? 0}
      </span>
    ),
  },
];

export function JudgesPage() {
  const { data: judges = [], isLoading, error } = useJudges();

  // Flatten for table display
  const rows = judges.map((j) => ({
    ...j,
    _displayName: j.name || "Unknown Judge", // Use name from schema
    _assigned: j._evalStats?.assigned ?? 0,
    _completed: j._evalStats?.completed ?? 0,
    _avgScore: j._evalStats?.avgScore ?? 0,
  }));

  const totalAssigned = rows.reduce((s, r) => s + r._assigned, 0);
  const totalCompleted = rows.reduce((s, r) => s + r._completed, 0);
  const avgScores = rows.filter((r) => r._avgScore > 0).map((r) => r._avgScore);
  const overallAvg =
    avgScores.length > 0
      ? (avgScores.reduce((a, b) => a + b, 0) / avgScores.length).toFixed(1)
      : "—";

  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading judges…
      </div>
    );

  if (error)
    return (
      <p className="py-10 text-sm text-destructive">
        Failed to load judges. Please check your permissions.
      </p>
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Total Judges", value: String(judges.length), hint: "registered in org" },
          { label: "Submissions Assigned", value: String(totalAssigned), hint: "across all judges" },
          { label: "Evaluations Completed", value: String(totalCompleted), progress: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0 },
          { label: "Avg Score", value: String(overallAvg), hint: "panel average" },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      <ListPageTemplate
        title="Judge Management"
        description="All judges registered in this organization with their evaluation stats."
        crumbs={[{ label: "Evaluation" }, { label: "Judges" }]}
        columns={columns as any}
        rows={rows as any}
        searchKeys={["_displayName", "expertise"] as any}
        facet={{
          label: "Competitions",
          key: "competitions" as any,
          options: [],
        }}
        rowActions={[
          { label: "View Details", onSelect: () => {} },
          { label: "View Evaluations", onSelect: () => {} },
        ]}
      />
    </>
  );
}
