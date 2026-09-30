import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ds/page-header";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useJudgeProfiles } from "@/modules/judges/services/judges.api";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";

export const Route = createFileRoute("/judge/events")({
  component: JudgeEventsPage,
});

function JudgeEventsPage() {
  const { selectedProfileId } = useJudgeProfile();
  const { data: profiles, isLoading } = useJudgeProfiles();
  const judge = profiles?.find((p) => p.id === selectedProfileId);

  const assignments = judge?.competitions || [];

  return (
    <div className="space-y-6 p-6">
      <ListPageTemplate<any>
        title="Assigned Competitions"
        description="View the events and competitions you have been assigned to judge."
        columns={[
          { key: "competition.name", header: "Competition", render: (row) => <span className="font-medium">{row.competition?.name}</span> },
          { key: "id", header: "Assignment ID", render: (row) => <span className="text-xs text-muted-foreground">{row.id}</span> },
        ]}
        rows={assignments}
        loading={isLoading}
        searchKeys={["competition.name"]}
      />
    </div>
  );
}
