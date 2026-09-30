import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { usePrizes } from "../services/winners.api";

const columns: Column<any>[] = [
  {
    key: "name",
    header: "Prize Name",
    sortable: true,
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  { key: "competition", header: "Competition", sortable: true, render: (row) => row.competition?.name },
  { key: "position", header: "Position", sortable: true },
  {
    key: "amount",
    header: "Value",
    sortable: true,
    render: (row) => <span className="tabular-nums font-semibold">{row.currency} {row.value}</span>,
  },
  {
    key: "createdAt",
    header: "Created Date",
    sortable: true,
    render: (row) => (
      <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      let statusId = "pending";
      if (row.status === "PAID") statusId = "published";
      return <StatusChip status={statusId as any} />;
    },
  },
];

export function PrizeDistributionPage() {
  const { data = [] } = usePrizes();

  return (
    <ListPageTemplate<any>
      title="Prize Distribution"
      description="Track and process grants, cash prizes, and physical awards."
      crumbs={[{ label: "Engagement" }, { label: "Winners", to: "/winners" }, { label: "Prizes" }]}
      columns={columns}
      rows={data}
      searchKeys={["winner", "competition", "reference"]}
      statusKey="status"
      facet={{
        label: "Status",
        key: "status",
        options: ["Pending", "Processing", "Distributed", "Failed"],
      }}
      rowActions={[
        { label: "Update Status", onSelect: () => {} },
        { label: "Add Reference", onSelect: () => {} },
        { label: "View Winner", onSelect: () => {} },
      ]}
    />
  );
}
