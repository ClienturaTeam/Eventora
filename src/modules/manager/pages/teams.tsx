import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useManagerTeams } from "../hooks/manager.api";
import { TeamDetailsDialog } from "@/components/teams/TeamDetailsDialog";

export function ManagerTeamsPage() {
  const { data = [], isLoading } = useManagerTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  return (
    <>
      <ListPageTemplate<any>
        title="Managed Teams"
        description="View teams you manage. Click any team name for complete end-to-end details."
        crumbs={[{ label: "Manager" }, { label: "Teams" }]}
        columns={[
          {
            key: "name",
            header: "Team Name",
            sortable: true,
            render: (row) => (
              <button
                type="button"
                onClick={() => setSelectedTeamId(row.id)}
                className="font-medium text-primary hover:underline text-left block"
              >
                {row.name}
              </button>
            ),
          },
          {
            key: "competition",
            header: "Competition",
            sortable: true,
            render: (row) => (
              <span>{row.competition?.name || row.competitionId}</span>
            ),
          },
          {
            key: "members",
            header: "Members",
            sortable: true,
            render: (row) => <span>{row.members?.length || row._count?.members || 0}</span>,
          },
          {
            key: "createdAt",
            header: "Created On",
            sortable: true,
            render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
          },
        ]}
        rows={data}
        loading={isLoading}
        searchKeys={["name"]}
        selectable={false}
        rowActions={[
          {
            label: "View Team Details",
            onSelect: (row) => setSelectedTeamId(row.id),
          },
        ]}
      />

      <TeamDetailsDialog
        open={!!selectedTeamId}
        onOpenChange={(open) => !open && setSelectedTeamId(null)}
        teamId={selectedTeamId}
      />
    </>
  );
}
