import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";
import { useMyEvaluations, useUpdateEvaluation } from "@/modules/judges/services/judges.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trophy,
  Layers,
  Users,
  Calendar,
  FileText,
  Paperclip,
  ExternalLink,
  Eye,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/judge/submissions")({
  component: JudgeSubmissionsPage,
});

function JudgeSubmissionsPage() {
  const { selectedProfileId } = useJudgeProfile();
  const { data: evaluations = [], isLoading } = useMyEvaluations(selectedProfileId);
  const updateEvaluation = useUpdateEvaluation();

  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [viewEval, setViewEval] = useState<any>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  const handleOpenGradeModal = (evaluation: any) => {
    setSelectedEval(evaluation);
    setScore(evaluation.score !== null && evaluation.score !== undefined ? String(evaluation.score) : "");
    setFeedback(evaluation.feedback || "");
    setRecommendation(evaluation.recommendation || "");
  };

  const handleOpenViewModal = (evaluation: any) => {
    setViewEval(evaluation);
  };

  const handleGrade = async () => {
    if (!selectedEval) return;

    const round = selectedEval.submission?.eventRound || selectedEval.eventRound;
    const maxMarks = round?.maxMarks ?? 100;

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) {
      toast.error("Please enter a valid numeric score.");
      return;
    }

    if (numericScore < 0) {
      toast.error("Score cannot be negative.");
      return;
    }

    if (numericScore > maxMarks) {
      toast.error(`Score cannot exceed maximum marks (${maxMarks}) for this round.`);
      return;
    }

    try {
      await updateEvaluation.mutateAsync({
        id: selectedEval.id,
        profileId: selectedProfileId || undefined,
        score: numericScore,
        feedback,
        recommendation: recommendation || undefined,
        status: "COMPLETED",
      });
      toast.success("Evaluation submitted successfully!");
      setSelectedEval(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit evaluation.");
    }
  };

  const completedCount = evaluations.filter((e: any) => e.status === "COMPLETED").length;
  const pendingCount = evaluations.filter((e: any) => e.status !== "COMPLETED").length;

  const statsList = [
    { label: "Assigned Submissions", value: String(evaluations.length) },
    { label: "Evaluated", value: String(completedCount) },
    { label: "Pending Evaluation", value: String(pendingCount) },
  ];

  return (
    <div className="space-y-6 p-6">
      <ListPageTemplate<any>
        title="Submissions & Grading"
        description="Review submissions assigned to you and provide grades and feedback."
        crumbs={[{ label: "Judge" }, { label: "Submissions" }]}
        stats={statsList}
        columns={[
          {
            key: "event",
            header: "Event & Round",
            render: (row) => {
              const sub = row.submission;
              const eventName = sub?.event?.name || sub?.competition?.event?.name || "Event";
              const round = sub?.eventRound || row.eventRound;
              const roundName = round
                ? `Round ${round.roundNumber} — ${round.name}`
                : `Round ${sub?.roundNumber || 1}`;

              return (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    {eventName}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit">
                    <Layers className="w-2.5 h-2.5 text-blue-500" />
                    {roundName}
                  </Badge>
                </div>
              );
            },
          },
          {
            key: "team",
            header: "Team & Problem Statement",
            render: (row) => {
              const sub = row.submission;
              const teamName = sub?.team?.name || (sub?.submittedBy ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}` : "Individual");
              const ps = sub?.problemStatement;

              return (
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm block text-foreground">{teamName}</span>
                  {ps ? (
                    <span className="text-xs text-primary font-medium block">
                      {ps.code}{ps.title ? ` — ${ps.title}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">General track</span>
                  )}
                </div>
              );
            },
          },
          {
            key: "title",
            header: "Submission",
            render: (row) => (
              <div>
                <span className="text-xs font-medium block">{row.submission?.title}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(row.submission?.createdAt || row.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            ),
          },
          {
            key: "score",
            header: "Score / Marks",
            render: (row) => {
              const round = row.submission?.eventRound || row.eventRound;
              const maxMarks = round?.maxMarks ?? 100;

              if (row.score !== null && row.score !== undefined) {
                return (
                  <span className="font-mono font-bold text-green-600 dark:text-green-400 text-sm">
                    {row.score} / {maxMarks}
                  </span>
                );
              }
              return <span className="text-xs text-muted-foreground italic">Not evaluated</span>;
            },
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant={row.status === "COMPLETED" ? "default" : "secondary"}>
                {row.status === "COMPLETED" ? "EVALUATED" : row.status}
              </Badge>
            ),
          },
        ]}
        rows={evaluations}
        loading={isLoading}
        searchKeys={[
          "submission.title",
          "submission.team.name",
          "submission.problemStatement.title",
          "submission.problemStatement.code",
        ]}
        rowActions={[
          {
            label: "View Submission",
            onSelect: (row) => handleOpenViewModal(row),
          },
          {
            label: "Evaluate",
            onSelect: (row) => handleOpenGradeModal(row),
          },
        ]}
      />

      {/* ─── READ-ONLY SUBMISSION VIEW MODAL ────────────────────────────────────── */}
      <Dialog open={!!viewEval} onOpenChange={(open) => !open && setViewEval(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Submission Details
            </DialogTitle>
          </DialogHeader>

          {viewEval && (() => {
            const sub = viewEval.submission;
            const eventName = sub?.event?.name || sub?.competition?.event?.name || "General Event";
            const round = sub?.eventRound || viewEval.eventRound;
            const roundName = round
              ? `Round ${round.roundNumber} — ${round.name}`
              : `Round ${sub?.roundNumber || 1}`;
            const maxMarks = round?.maxMarks ?? 100;
            const teamName = sub?.team?.name || (sub?.submittedBy ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}` : "Participant");
            const ps = sub?.problemStatement;
            const payload = sub?.payload as Record<string, any> | null;
            const summary = payload ? (payload["description"] || payload["summary"] || payload["notes"]) : undefined;
            const files = sub?.files || [];

            return (
              <div className="space-y-4 py-2 text-xs">
                {/* Header Information Box */}
                <div className="p-3.5 bg-muted/40 rounded-lg border space-y-2">
                  <div className="font-semibold text-sm text-foreground">{sub?.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="block text-[10px]">Event</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {eventName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Round & Max Marks</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-500" />
                        {roundName} ({maxMarks} Marks)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/50">
                    <div>
                      <span className="block text-[10px]">Team</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        {teamName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Submitted At</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(sub?.createdAt || viewEval.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem Statement Box */}
                {ps && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-muted-foreground">Problem Statement</span>
                    <div className="font-semibold text-primary">
                      {ps.code} — {ps.title}
                    </div>
                    {ps.description && (
                      <p className="text-muted-foreground text-[11px] leading-relaxed pt-0.5">{ps.description}</p>
                    )}
                  </div>
                )}

                {/* Description */}
                {summary && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Description</Label>
                    <div className="p-2.5 rounded border bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap">
                      {String(summary)}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {files.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Uploaded Files ({files.length})</Label>
                    <div className="space-y-1">
                      {files.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-2 rounded border bg-card">
                          <div className="flex items-center gap-2 truncate mr-2">
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{file.fileName}</span>
                            {file.fileSize && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ({Math.round(file.fileSize / 1024)} KB)
                              </span>
                            )}
                          </div>
                          {file.fileUrl && (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-[11px] shrink-0 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View / Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Evaluation Status */}
                {viewEval.score !== null && viewEval.score !== undefined && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-700 dark:text-green-300">Your Evaluation</span>
                      <span className="font-mono font-bold text-green-700 dark:text-green-300">
                        {viewEval.score} / {maxMarks}
                      </span>
                    </div>
                    {viewEval.recommendation && (
                      <div className="text-[11px] text-muted-foreground">
                        Recommendation: <span className="font-medium text-foreground">{viewEval.recommendation}</span>
                      </div>
                    )}
                    {viewEval.feedback && (
                      <p className="text-[11px] text-foreground leading-relaxed pt-1">
                        Feedback: {viewEval.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewEval(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const target = viewEval;
                setViewEval(null);
                handleOpenGradeModal(target);
              }}
            >
              Evaluate Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── EVALUATION FORM MODAL ──────────────────────────────────────────────── */}
      <Dialog open={!!selectedEval} onOpenChange={(open) => !open && setSelectedEval(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Evaluate Submission
            </DialogTitle>
          </DialogHeader>

          {selectedEval && (() => {
            const sub = selectedEval.submission;
            const eventName = sub?.event?.name || sub?.competition?.event?.name || "General Event";
            const round = sub?.eventRound || selectedEval.eventRound;
            const roundName = round
              ? `Round ${round.roundNumber} — ${round.name}`
              : `Round ${sub?.roundNumber || 1}`;
            const maxMarks = round?.maxMarks ?? 100;
            const teamName = sub?.team?.name || (sub?.submittedBy ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}` : "Participant");
            const ps = sub?.problemStatement;
            const payload = sub?.payload as Record<string, any> | null;
            const summary = payload ? (payload["description"] || payload["summary"] || payload["notes"]) : undefined;
            const files = sub?.files || [];

            return (
              <div className="space-y-4 py-2">
                {/* Read-only Submission Summary Box */}
                <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5 text-xs">
                  <div className="font-semibold text-sm text-foreground">{sub?.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span className="block text-[10px]">Event</span>
                      <span className="font-medium text-foreground">{eventName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Round</span>
                      <span className="font-medium text-foreground">{roundName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/50">
                    <div>
                      <span className="block text-[10px]">Team</span>
                      <span className="font-medium text-foreground">{teamName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Submitted At</span>
                      <span className="font-medium text-foreground">
                        {new Date(sub?.createdAt || selectedEval.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {ps && (
                    <div className="pt-1 border-t border-border/50 text-[11px]">
                      <span className="text-muted-foreground">Problem Statement: </span>
                      <span className="font-medium text-primary">{ps.code} — {ps.title}</span>
                    </div>
                  )}
                  {summary && (
                    <div className="pt-1 text-[11px] text-muted-foreground line-clamp-2">
                      <span className="font-semibold">Description: </span>
                      {String(summary)}
                    </div>
                  )}
                  {files.length > 0 && (
                    <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Paperclip className="w-3 h-3 text-primary" />
                      <span>{files.length} attached file(s) available</span>
                    </div>
                  )}
                </div>

                {/* Score Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="score" className="text-xs font-semibold">
                      Score
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Maximum marks: <span className="font-bold text-foreground">{maxMarks}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="score"
                      type="number"
                      min={0}
                      max={maxMarks}
                      step="any"
                      placeholder={`0 to ${maxMarks}`}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      / {maxMarks}
                    </span>
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-xs font-semibold">
                    Feedback
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide constructive feedback for the team..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="text-xs leading-relaxed"
                  />
                </div>

                {/* Recommendation Input */}
                <div className="space-y-2">
                  <Label htmlFor="recommendation" className="text-xs font-semibold">
                    Recommendation
                  </Label>
                  <Select value={recommendation} onValueChange={setRecommendation}>
                    <SelectTrigger id="recommendation" className="h-9 text-xs">
                      <SelectValue placeholder="[ Select recommendation ]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUALIFY" className="text-xs">
                        Qualify / Recommended for Next Round
                      </SelectItem>
                      <SelectItem value="NEEDS_REVISION" className="text-xs">
                        Needs Revision / Conditional
                      </SelectItem>
                      <SelectItem value="REJECT" className="text-xs">
                        Not Recommended / Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedEval(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGrade}
              disabled={updateEvaluation.isPending}
            >
              {updateEvaluation.isPending ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
