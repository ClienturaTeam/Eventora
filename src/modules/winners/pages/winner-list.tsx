import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useWinners } from "../services/winners.api";
import { Badge } from "@/components/ui/badge";

const columns: Column<any>[] = [
  {
    key: "winner",
    header: "Winner",
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium">
          {row.team ? row.team.name : row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground">{row.submission?.title}</p>
      </div>
    ),
  },
  { 
    key: "competition", 
    header: "Competition", 
    sortable: true,
    render: (row) => row.competition?.name 
  },
  {
    key: "position",
    header: "Position",
    sortable: true,
    render: (row) => <Badge variant="outline">{row.position}</Badge>,
  },
  { 
    key: "prize", 
    header: "Prize", 
    sortable: false,
    render: (row) => row.prize ? `${row.prize.name} (${row.prize.currency || ''} ${row.prize.value || ''})` : "—"
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      let statusId = "pending";
      if (row.status === "FINALIZED") statusId = "active";
      return <StatusChip status={statusId as any} />;
    },
  },
  {
    key: "createdAt",
    header: "Date",
    sortable: true,
    render: (row) => (
      <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>
    ),
  },
];

export function WinnerListPage() {
  const { data = [] } = useWinners();

  return (
    <ListPageTemplate<any>
      title="Winners List"
      description="Database of all competition champions, finalists, and prize recipients."
      crumbs={[
        { label: "Engagement" },
        { label: "Winners", to: "/winners" },
        { label: "All Winners" },
      ]}
      columns={columns}
      rows={data}
      searchKeys={["winner", "competition", "team"]}
      dateKey="createdAt"
      facet={{
        label: "Position",
        key: "position",
        options: ["Winner", "Runner-up", "Second Runner-up", "Finalist", "Special Mention"],
      }}
      createLabel="Select Winners"
      createTo="/winners/selection"
      rowActions={[
        { label: "View Profile", onSelect: () => {} },
        { label: "Process Prize", onSelect: () => {} },
        { label: "Generate Certificate", onSelect: () => {} },
      ]}
    />
  );
}
