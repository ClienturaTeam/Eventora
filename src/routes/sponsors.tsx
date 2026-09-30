import { createFileRoute } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useSponsors, useSponsorsDashboard } from "@/modules/sponsors/hooks/sponsors.api";

type Row = {
  id: string;
  name: string;
  tier: string;
  value: string;
  events: number;
  contact: string;
  status: string;
};

const columns: Column<Row>[] = [
  {
    key: "name",
    header: "Sponsor",
    sortable: true,
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  { key: "tier", header: "Tier", sortable: true },
  { key: "value", header: "Committed value", sortable: true },
  { key: "events", header: "Events", sortable: true },
  { key: "contact", header: "Contact" },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      let statusId = "pending";
      if (row.status === "ACTIVE") statusId = "active";
      if (row.status === "EXPIRED") statusId = "archived";
      return <StatusChip status={statusId as any} />;
    },
  },
];

export const Route = createFileRoute("/sponsors")({
  head: () => ({
    meta: [
      { title: "Sponsors · Eventora Platform" },
      {
        name: "description",
        content: "Sponsorship tiers, committed value and deliverable tracking.",
      },
      { property: "og:title", content: "Sponsors · Eventora Platform" },
      {
        property: "og:description",
        content: "Sponsorship tiers, committed value and deliverable tracking.",
      },
    ],
  }),
  component: SponsorsPage,
});

function SponsorsPage() {
  const { data: sponsors = [], isLoading: isSponsorsLoading } = useSponsors();
  const { data: stats, isLoading: isStatsLoading } = useSponsorsDashboard();

  const rows: Row[] = sponsors.map((s: any) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    value: `₹${s.committedValue?.toLocaleString("en-IN") || "0"}`,
    events: s._count?.sponsorships || 0,
    contact: s.contacts?.[0]?.email || "N/A",
    status: s.status || "ACTIVE",
  }));

  return (
    <ListPageTemplate<Row>
      title="Sponsors"
      description="Sponsorship tiers, committed value and deliverable tracking."
      crumbs={[{ label: "People" }, { label: "Sponsors" }]}
      columns={columns}
      rows={rows}
      loading={isSponsorsLoading || isStatsLoading}
      searchKeys={["name", "tier", "contact"]}
      statusKey="status"
      stats={[
        { label: "Sponsors", value: stats?.sponsors?.toString() || "0" },
        { label: "Committed value", value: `₹${(stats?.committedValue || 0).toLocaleString("en-IN")}` },
        { label: "Deliverables met", value: `${stats?.deliverablesMet || 0}%`, progress: stats?.deliverablesMet || 0 },
        { label: "Renewals pending", value: stats?.renewalsPending?.toString() || "0", hint: "next 90 days" },
      ]}
      facet={{ label: "Tier", key: "tier", options: ["Platinum", "Gold", "Silver", "BRONZE", "GOLD", "PLATINUM"] }}
      createLabel="Add sponsor"
      rowActions={[
        { label: "View details", onSelect: () => {} },
        { label: "Duplicate", onSelect: () => {} },
        { label: "Archive", onSelect: () => {} },
      ]}
    />
  );
}

