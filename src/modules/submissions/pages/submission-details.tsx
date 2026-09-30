import { DetailsPageTemplate } from "@/components/templates/details-page";
import { SectionCard } from "@/components/ds/page-header";
import { StatusChip } from "@/components/ds/status-chip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParams } from "@tanstack/react-router";
import { useSubmission } from "../services/submissions.api";

export function SubmissionDetailsPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: submission, isLoading } = useSubmission(id);

  if (isLoading) {
    return <div className="p-8">Loading submission details...</div>;
  }

  if (!submission) {
    return <div className="p-8">Submission not found</div>;
  }

  const evaluations = submission.evaluations || [];
  const validScores = evaluations.filter(e => e.score !== null).map(e => e.score as number);
  const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : "0";

  return (
    <DetailsPageTemplate
      title={`${submission.id.substring(0, 8).toUpperCase()} · ${submission.title}`}
      description={`${submission.competition?.name || "Competition"} · ${submission.team?.name || "Team"}`}
      crumbs={[
        { label: "Programs" },
        { label: "Submissions", to: "/submissions" },
        { label: "Submission details" },
      ]}
      meta={
        <>
          <StatusChip status={submission.status.toLowerCase() as any} />
          <span className="text-xs text-muted-foreground">Created on {new Date(submission.createdAt).toLocaleDateString()}</span>
        </>
      }
      actions={
        <>
          <Button variant="outline">Edit</Button>
          <Button>Share</Button>
        </>
      }
      metrics={[
        { label: "Score", value: avgScore, caption: "average" },
        { label: "Evaluations", value: `${evaluations.length}` },
        { label: "Plagiarism", value: "0 flags" }, // Not real yet
      ]}
      overview={
        <div className="space-y-4">
          {submission.problemStatement && (
            <SectionCard title="Problem Statement" description="Assigned problem statement details">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-primary">
                  <span>{submission.problemStatement.code}</span>
                  <span>•</span>
                  <span>{submission.problemStatement.title}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {submission.problemStatement.description}
                </p>
                {submission.problemStatement.category && (
                  <div className="pt-1">
                    <span className="text-xs font-medium text-foreground">Category: {submission.problemStatement.category}</span>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Evaluations breakdown" description="Judge feedback and scores" padded={false}>
            <ul className="divide-y divide-border">
              {evaluations.length > 0 ? (
                evaluations.map((e) => (
                  <li key={e.id} className="px-5 py-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <p className="truncate text-sm font-medium">{e.judge.firstName} {e.judge.lastName}</p>
                      <span className="shrink-0 text-sm tabular-nums">
                        {e.score || 0} / 100
                      </span>
                    </div>
                    <Progress value={e.score || 0} className="mt-2 h-1.5" />
                    <p className="mt-2 text-xs text-muted-foreground">{e.feedback || "No feedback provided."}</p>
                  </li>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No evaluations yet.
                </div>
              )}
            </ul>
          </SectionCard>
        </div>
      }
    />
  );
}
