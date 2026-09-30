import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { CalendarDays, FileCheck2, ClipboardCheck } from "lucide-react";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";
import { useMyEvaluations, useJudgeProfiles } from "@/modules/judges/services/judges.api";

export const Route = createFileRoute("/judge/")({
  component: JudgeDashboardPage,
});

function JudgeDashboardPage() {
  const { user } = useAuth();
  const { selectedProfileId } = useJudgeProfile();
  const { data: profiles } = useJudgeProfiles();
  const currentProfile = profiles?.find(p => p.id === selectedProfileId);
  
  const { data: evaluations = [] } = useMyEvaluations(selectedProfileId);

  const pendingEvals = evaluations.filter((e: any) => e.status !== "COMPLETED");
  const completedEvals = evaluations.filter((e: any) => e.status === "COMPLETED");
  const avgScore = completedEvals.length > 0 
    ? completedEvals.reduce((a: number, b: any) => a + (b.score || 0), 0) / completedEvals.length 
    : 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Judge Dashboard"
        description={`Welcome back, ${currentProfile?.name || 'Judge'}! Here is your evaluation overview.`}
      />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Evaluations"
          value={String(pendingEvals.length)}
          icon={ClipboardCheck}
          hint="Submissions waiting for your score"
          index={0}
        />
        <StatCard
          label="Completed Evaluations"
          value={String(completedEvals.length)}
          icon={FileCheck2}
          hint="Total submissions graded"
          index={1}
        />
        <StatCard
          label="Average Score Given"
          value={avgScore.toFixed(1)}
          icon={CalendarDays}
          hint="Across all your evaluations"
          index={2}
        />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Getting Started</h3>
        <p className="text-muted-foreground mb-4">
          As a judge, your role is to review submissions from participants and provide fair and constructive feedback. 
          Use the navigation menu on the left to view events you have been assigned to, or jump straight into 
          grading submissions.
        </p>
      </div>
    </div>
  );
}
