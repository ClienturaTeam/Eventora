import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import type { Column } from "@/components/ds/data-table";
import { useTeams, useDeleteTeam, ApiTeam } from "../services/teams.api";
import { TeamDialog } from "../components/team-dialog";
import { EventDetailsDialog } from "@/components/events/EventDetailsDialog";
import { ApiEvent } from "@/modules/events/services/events.api";
import { toast } from "sonner";

export function TeamsListPage() {
  const { data: teams = [], isLoading } = useTeams();
  const deleteMutation = useDeleteTeam();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ApiTeam | null>(null);
  const [selectedDetailEventId, setSelectedDetailEventId] = useState<string | null>(null);

  const handleEdit = (row: ApiTeam) => {
    setEditingTeam(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row: ApiTeam) => {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(row.id);
      toast.success("Team deleted");
    } catch {
      toast.error("Failed to delete team");
    }
  };

  const columns: Column<ApiTeam>[] = [
    {
      key: "name",
      header: "Team",
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "competitionId",
      header: "Competition / Event",
      sortable: true,
      render: (row) => {
        const evt = row.competition?.event as any;
        const name = row.competition?.name ?? "—";
        if (evt?.id) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDetailEventId(evt.id);
              }}
              className="font-medium text-primary hover:underline text-left"
            >
              {name}
            </button>
          );
        }
        return <span>{name}</span>;
      },
    },
    {
      key: "_count",
      header: "Members",
      render: (row) => <span className="tabular-nums">{row._count?.members ?? 0}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <>
      <ListPageTemplate<ApiTeam>
        title="Teams"
        description="Team formation and membership across all competitions."
        crumbs={[{ label: "Programs" }, { label: "Teams" }]}
        columns={columns}
        rows={teams}
        loading={isLoading}
        searchKeys={["name", "competition.name", "id"]}
        dateKey="createdAt"
        selectable={false}
        stats={[
          { label: "Total teams", value: String(teams.length) },
          {
            label: "Total members",
            value: String(teams.reduce((s, t) => s + (t._count?.members ?? 0), 0)),
          },
          {
            label: "Avg team size",
            value: teams.length
              ? (teams.reduce((s, t) => s + (t._count?.members ?? 0), 0) / teams.length).toFixed(1)
              : "—",
          },
        ]}
        createLabel="Create team"
        onCreate={() => {
          setEditingTeam(null);
          setDialogOpen(true);
        }}
        rowActions={[
          { label: "Edit", onSelect: (row) => handleEdit(row) },
          { label: "Delete", onSelect: (row) => handleDelete(row) },
        ]}
      />
      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        team={editingTeam}
      />
      <EventDetailsDialog
        open={!!selectedDetailEventId}
        onOpenChange={(open) => !open && setSelectedDetailEventId(null)}
        eventId={selectedDetailEventId}
        mode="admin"
      />
    </>
  );
}
