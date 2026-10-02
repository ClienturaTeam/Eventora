import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";
import { useMyEvaluations, useUpdateEvaluation } from "@/modules/judges/services/judges.api";
import { useEvents, useEventRounds } from "@/modules/events/services/events.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Paperclip,
  Eye,
  CheckCircle,
  Filter,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/judge/submissions")({
  component: JudgeSubmissionsPage,
});

function JudgeSubmissionsPage() {
  const { selectedProfileId } = useJudgeProfile();

  // Filter states
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>("ALL");

  // Fetch events list for Event dropdown
  const { data: events = [] } = useEvents();

  // Fetch rounds for selected event (if specific event chosen)
  const activeEventId = selectedEventId !== "ALL" ? selectedEventId : "";
  const { data: eventRounds = [] } = useEventRounds(activeEventId);

  // Query judge's assigned evaluations from backend
  const { data: rawEvaluations = [], isLoading } = useMyEvaluations({
    profileId: selectedProfileId,
    eventId: selectedEventId !== "ALL" ? selectedEventId : undefined,
    roundId: selectedRoundFilter !== "ALL" ? selectedRoundFilter : undefined,
  });

  const updateEvaluation = useUpdateEvaluation();

  // Modal states for viewing submission and entering evaluation
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  const handleEventChange = (value: string) => {
    setSelectedEventId(value);
    setSelectedRoundFilter("ALL");
  };

  const handleRoundChange = (roundId: string) => {
    setSelectedRoundFilter(roundId);
  };

  // Filter evaluations to strictly assigned submissions
  const filteredEvaluations = useMemo(() => {
    let result = rawEvaluations;

    if (selectedEventId !== "ALL") {
      result = result.filter((e: any) => {
        const sub = e.submission;
        const eId = sub?.eventId || sub?.event?.id || sub?.competition?.eventId || sub?.competition?.event?.id;
        return eId === selectedEventId;
      });
    }

    if (selectedRoundFilter !== "ALL") {
      result = result.filter((e: any) => {
        const sub = e.submission;
        const round = sub?.eventRound || e.eventRound;
        const isMatchId = round?.id === selectedRoundFilter || e.roundId === selectedRoundFilter || sub?.roundId === selectedRoundFilter;
        const isMatchNum = String(round?.roundNumber) === selectedRoundFilter || String(sub?.roundNumber) === selectedRoundFilter;
        return isMatchId || isMatchNum;
      });
    }

    return result;
  }, [rawEvaluations, selectedEventId, selectedRoundFilter]);

  // Dynamic round list: prioritize fetched eventRounds, or extract unique rounds from assigned submissions
  const availableRounds = useMemo(() => {
    if (activeEventId && eventRounds.length > 0) {
      return eventRounds.map((r) => ({
        id: r.id,
        roundNumber: r.roundNumber,
        name: r.name,
      }));
    }

    // Extract unique rounds from evaluations if no event selected or rounds not yet loaded
    const roundsMap = new Map<string, { id: string; roundNumber: number; name: string }>();
    for (const ev of rawEvaluations) {
      const r = ev.submission?.eventRound || ev.eventRound;
      if (r && r.id && !roundsMap.has(r.id)) {
        roundsMap.set(r.id, {
          id: r.id,
          roundNumber: r.roundNumber || 1,
          name: r.name || `Round ${r.roundNumber || 1}`,
        });
      }
    }
    return Array.from(roundsMap.values()).sort((a, b) => a.roundNumber - b.roundNumber);
  }, [activeEventId, eventRounds, rawEvaluations]);

  // Open the submission view and evaluation modal
  const handleOpenSubmission = (evaluation: any) => {
    setSelectedEval(evaluation);
    setScore(
      evaluation.score !== null && evaluation.score !== undefined
        ? String(evaluation.score)
        : ""
    );
    setFeedback(evaluation.feedback || "");
    setRecommendation(evaluation.recommendation || "");
  };

  // Save / Update evaluation
  const handleSaveEvaluation = async () => {
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

      toast.success("Evaluation saved successfully");

      // Update active modal evaluation record with new values so UI immediately reflects it
      setSelectedEval((prev: any) =>
        prev
          ? {
              ...prev,
              score: numericScore,
              feedback,
              recommendation: recommendation || undefined,
              status: "COMPLETED",
            }
          : null
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save evaluation.");
    }
  };

  // Summary statistics from backend data
  const totalAssigned = rawEvaluations.length;
  const completedCount = rawEvaluations.filter(
    (e: any) => e.status === "COMPLETED" || (e.score !== null && e.score !== undefined)
  ).length;
  const pendingCount = totalAssigned - completedCount;

  const statsList = [
    { label: "Assigned Submissions", value: String(totalAssigned) },
    { label: "Evaluated", value: String(completedCount) },
    { label: "Pending Evaluation", value: String(pendingCount) },
  ];

  return (
    <div className="space-y-4 p-6">
      {/* ─── FILTERS BAR (Event Dropdown & Dynamic Round Buttons) ────────────── */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 border rounded-xl">
        {/* Event Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Event:
          </Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="h-8 text-xs min-w-[220px] bg-background">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                All Events
              </SelectItem>
              {events.map((evt) => (
                <SelectItem key={evt.id} value={evt.id} className="text-xs">
                  {evt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Round Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Label className="text-xs font-semibold text-muted-foreground mr-1">Round:</Label>
          <Button
            variant={selectedRoundFilter === "ALL" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => handleRoundChange("ALL")}
          >
            All Rounds
          </Button>

          {availableRounds.map((round) => {
            const isSelected = selectedRoundFilter === round.id;
            const hasCustomName =
              round.name &&
              round.name.trim() !== "" &&
              round.name.trim().toLowerCase() !== `round ${round.roundNumber}`;
            const roundLabel = hasCustomName
              ? `Round ${round.roundNumber} — ${round.name}`
              : `Round ${round.roundNumber}`;

            return (
              <Button
                key={round.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => handleRoundChange(round.id)}
              >
                {roundLabel}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN SUBMISSIONS TABLE (ListPageTemplate) ───────────────────────── */}
      <ListPageTemplate<any>
        title="Submissions & Grading"
        description="Review submissions assigned to you and provide grades and feedback."
        crumbs={[{ label: "Judge" }, { label: "Submissions & Grading" }]}
        stats={statsList}
        columns={[
          {
            key: "eventRound",
            header: "EVENT & ROUND",
            render: (row) => {
              const sub = row.submission;
              const eventName = sub?.event?.name || sub?.competition?.event?.name || "Event";
              const round = sub?.eventRound || row.eventRound;
              const roundName = round
                ? `Round ${round.roundNumber} — ${round.name}`
                : `Round ${sub?.roundNumber || 1}`;

              return (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{eventName}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit font-normal">
                    <Layers className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                    {roundName}
                  </Badge>
                </div>
              );
            },
          },
          {
            key: "teamProblem",
            header: "TEAM & PROBLEM STATEMENT",
            render: (row) => {
              const sub = row.submission;
              const teamName =
                sub?.team?.name ||
                (sub?.submittedBy
                  ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`
                  : "Individual Participant");
              const ps = sub?.problemStatement;

              return (
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{teamName}</span>
                  </div>
                  {ps ? (
                    <div className="text-xs text-primary font-medium flex items-center gap-1">
                      <span className="font-semibold text-foreground/80">{ps.code}:</span>
                      <span className="truncate">{ps.title}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">General Track</span>
                  )}
                </div>
              );
            },
          },
          {
            key: "submission",
            header: "SUBMISSION",
            render: (row) => {
              const sub = row.submission;
              const date = sub?.createdAt || row.createdAt;

              return (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold block text-foreground truncate max-w-[220px]">
                    {sub?.title || "Untitled Submission"}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    {new Date(date).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              );
            },
          },
          {
            key: "score",
            header: "SCORE / MARKS",
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
            header: "STATUS",
            render: (row) => {
              const isEvaluated =
                row.status === "COMPLETED" || (row.score !== null && row.score !== undefined);

              return isEvaluated ? (
                <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                  EVALUATED
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px] font-normal">
                  PENDING
                </Badge>
              );
            },
          },
          {
            key: "action",
            header: "ACTION",
            render: (row) => (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenSubmission(row);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                View & Evaluate
              </Button>
            ),
          },
        ]}
        rows={filteredEvaluations}
        loading={isLoading}
        searchKeys={[
          "submission.team.name",
          "submission.problemStatement.title",
          "submission.problemStatement.code",
          "submission.title",
          "submission.event.name",
          "submission.competition.name",
        ]}
        onRowClick={(row) => handleOpenSubmission(row)}
        emptyTitle="No assigned submissions found"
        emptyDescription="Submissions assigned to you by the event manager will appear here for evaluation."
      />

      {/* ─── COMPLETE SUBMISSION VIEW & EVALUATION MODAL ────────────────────── */}
      <Dialog
        open={!!selectedEval}
        onOpenChange={(open) => {
          if (!open) setSelectedEval(null);
        }}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-primary" />
              Submission & Evaluation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review submission details, deliverables, and record grades and constructive feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedEval && (() => {
            const sub = selectedEval.submission;
            const eventName =
              sub?.event?.name || sub?.competition?.event?.name || "General Event";
            const round = sub?.eventRound || selectedEval.eventRound;
            const roundName = round
              ? `Round ${round.roundNumber} — ${round.name}`
              : `Round ${sub?.roundNumber || 1}`;
            const maxMarks = round?.maxMarks ?? 100;
            const teamName =
              sub?.team?.name ||
              (sub?.submittedBy
                ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`
                : "Participant");
            const submittedByText = sub?.submittedBy
              ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName} (${sub.submittedBy.email})`
              : teamName;
            const ps = sub?.problemStatement;
            const payload = sub?.payload as Record<string, any> | null;
            const projectDescription =
              (payload
                ? payload["description"] || payload["summary"] || payload["notes"]
                : undefined) || sub?.description;
            const files = sub?.files || [];

            const isEvaluated =
              selectedEval.status === "COMPLETED" ||
              (selectedEval.score !== null && selectedEval.score !== undefined);

            return (
              <div className="space-y-5 py-2 text-xs">
                {/* ── SECTION 1: SUBMISSION DETAILS ─────────────────────────── */}
                <div className="space-y-3 p-4 bg-muted/30 border rounded-xl">
                  {/* Title & Status Banner */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Submission Title
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-0.5">
                        {sub?.title || "Untitled Submission"}
                      </h4>
                    </div>
                    <Badge
                      className={
                        isEvaluated
                          ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : ""
                      }
                      variant={isEvaluated ? "outline" : "secondary"}
                    >
                      {isEvaluated ? "EVALUATED" : "PENDING EVALUATION"}
                    </Badge>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">EVENT</span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {eventName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">ROUND & MAX MARKS</span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {roundName} ({maxMarks} Marks)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">TEAM NAME</span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        {teamName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">SUBMITTED BY</span>
                      <span className="font-medium text-foreground truncate block mt-0.5" title={submittedByText}>
                        {submittedByText}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">SUBMITTED DATE & TIME</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {new Date(sub?.createdAt || selectedEval.createdAt).toLocaleString(undefined, {
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

                  {/* Problem Statement Box */}
                  {ps ? (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Problem Statement
                      </span>
                      <div className="font-bold text-primary text-xs">
                        {ps.code} — {ps.title}
                      </div>
                      {ps.description && (
                        <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                          {ps.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-muted/40 rounded border text-muted-foreground italic text-[11px]">
                      General Track Submission (No specific problem statement assigned).
                    </div>
                  )}

                  {/* Submission Description */}
                  {projectDescription && (
                    <div className="space-y-1 pt-1">
                      <Label className="text-xs font-semibold text-foreground">
                        Submission Description
                      </Label>
                      <div className="p-3 rounded-lg border bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap text-[11px]">
                        {String(projectDescription)}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Files (VIEW ONLY) */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                      Uploaded Files ({files.length})
                    </Label>
                    {files.length > 0 ? (
                      <div className="space-y-1.5">
                        {files.map((file: any) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded-lg border bg-card/60 hover:bg-card transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2 truncate mr-3">
                              <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-medium truncate text-foreground">{file.fileName}</span>
                              {file.fileSize && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  ({Math.round(file.fileSize / 1024)} KB)
                                </span>
                              )}
                            </div>
                            {/* Strictly VIEW ONLY action */}
                            {file.fileUrl && (
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        No files uploaded for this round submission.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── SECTION 2: EVALUATION SECTION ─────────────────────────── */}
                <div className="space-y-4 p-4 border border-primary/30 bg-primary/5 rounded-xl">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-foreground">Evaluation</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Current Evaluation:</span>
                      <Badge
                        className={
                          isEvaluated
                            ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : ""
                        }
                        variant={isEvaluated ? "default" : "secondary"}
                      >
                        {isEvaluated ? "Evaluated" : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  {/* Marks Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marks" className="text-xs font-semibold text-foreground">
                        Marks / Score
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Maximum Marks: <span className="font-bold text-foreground">{maxMarks}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="marks"
                        type="number"
                        min={0}
                        max={maxMarks}
                        step="any"
                        placeholder={`0 to ${maxMarks}`}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="font-mono text-sm max-w-[160px] bg-background"
                      />
                      <span className="text-sm font-semibold text-muted-foreground">
                        / {maxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <Label htmlFor="feedback" className="text-xs font-semibold text-foreground">
                      Feedback
                    </Label>
                    <Textarea
                      id="feedback"
                      rows={4}
                      placeholder="Enter constructive feedback, critique, and suggestions for the team..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="text-xs leading-relaxed bg-background"
                    />
                  </div>

                  {/* Recommendation Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="recommendation" className="text-xs font-semibold text-foreground">
                      Recommendation
                    </Label>
                    <Select value={recommendation} onValueChange={setRecommendation}>
                      <SelectTrigger id="recommendation" className="h-8 text-xs bg-background">
                        <SelectValue placeholder="[ Select optional recommendation ]" />
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
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedEval(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEvaluation}
              disabled={updateEvaluation.isPending}
              className="gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {updateEvaluation.isPending ? "Saving..." : "Save Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
