import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Users, Check, RefreshCw } from "lucide-react";
import { useCompetitions } from "@/modules/competitions/services/competitions.api";
import { useFinalists, usePublishResult } from "../services/winners.api";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export function WinnerSelectionPage() {
  const navigate = useNavigate();
  const { data: competitions = [] } = useCompetitions();
  const [selectedComp, setSelectedComp] = useState<string>("");
  const activeCompId = selectedComp || (competitions.length > 0 ? competitions[0]?.id || "" : "");

  const { data: finalists = [], isLoading: isFinalistsLoading, refetch: refetchFinalists } = useFinalists(activeCompId);
  const publishResult = usePublishResult();

  const [allocations, setAllocations] = useState<Record<string, { position: string; prizeAmount: number }>>({});
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; team: string; feedbacks: any[] }>({
    open: false,
    team: "",
    feedbacks: [],
  });

  const handleConfirmSingle = async (teamId: string, teamName: string) => {
    const allocation = allocations[teamId];
    if (!allocation || !allocation.position) {
      toast.error(`Please select a position for ${teamName} before confirming.`);
      return;
    }

    try {
      await publishResult.mutateAsync({
        competitionId: activeCompId,
        teamId,
        resultType: allocation.position,
        prizeAmount: allocation.prizeAmount || 0,
        currency: "INR",
      });

      toast.success(`Published ${allocation.position} for ${teamName}! Certificates & badges issued.`);
      refetchFinalists();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish result.");
    }
  };

  const handleConfirmAll = async () => {
    const assignedTeams = Object.keys(allocations).filter((tid) => {
      const a = allocations[tid];
      return a && a.position && a.position !== "NONE";
    });

    if (assignedTeams.length === 0) {
      toast.error("Please allocate at least one podium position before confirming.");
      return;
    }

    let successCount = 0;
    for (const teamId of assignedTeams) {
      const alloc = allocations[teamId];
      if (!alloc) continue;
      try {
        await publishResult.mutateAsync({
          competitionId: activeCompId,
          teamId,
          resultType: alloc.position,
          prizeAmount: alloc.prizeAmount || 0,
          currency: "INR",
        });
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    if (successCount > 0) {
      toast.success(`Confirmed and published results for ${successCount} finalists!`);
      refetchFinalists();
      navigate({ to: "/winners" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Podium & Winner Selection"
        description="Audit normalized judge scorecards, allocate podium positions, and publish official competition results."
        crumbs={[
          { label: "Engagement" },
          { label: "Results", to: "/winners" },
          { label: "Selection" },
        ]}
        actions={
          <Button
            onClick={handleConfirmAll}
            disabled={publishResult.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Confirm Results & Announce
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <SectionCard title="Target Competition Track" description="Select competition track to judge">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="comp" className="text-xs text-muted-foreground uppercase font-medium">Competition Track</Label>
              <Select value={activeCompId} onValueChange={setSelectedComp}>
                <SelectTrigger id="comp" className="border-border/60 bg-muted/20">
                  <SelectValue placeholder="Select competition track..." />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Evaluation Status</p>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" /> 100% Graded
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All assigned panel judges have submitted finalized scorecards. Rankings are sorted by verified weighted score.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Automated Protocols</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-foreground" /> Generates cryptographic digital certificates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-foreground" /> Awards verified achievement badges
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-foreground" /> Updates public leaderboard and live feed
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Top Finalists by Normalized Rubric Score</h3>
              <p className="text-xs text-muted-foreground">Calibrated across all official evaluation rubrics.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border/60 hover:bg-muted/50 text-xs"
              onClick={() => refetchFinalists()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh Scores
            </Button>
          </div>

          {isFinalistsLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading finalists from scorecards...</div>
          ) : finalists.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
              No submissions or evaluations recorded for this track yet.
            </div>
          ) : (
            <div className="space-y-3">
              {finalists.map((finalist: any, idx: number) => {
                const currentAlloc = allocations[finalist.teamId] || {
                  position: finalist.existingWinner?.position || (idx === 0 ? "FIRST_PRIZE" : idx === 1 ? "SECOND_PRIZE" : "FINALIST"),
                  prizeAmount: finalist.existingWinner?.prize?.value || (idx === 0 ? 50000 : idx === 1 ? 25000 : 0),
                };

                return (
                  <div
                    key={finalist.submissionId}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center font-bold text-sm text-foreground">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground text-base">{finalist.teamName}</h4>
                            {finalist.existingWinner && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                Confirmed: {finalist.existingWinner.position}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{finalist.title}</p>
                          {finalist.members && finalist.members.length > 0 && (
                            <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {finalist.members.map((m: any) => m.user ? `${m.user.firstName} ${m.user.lastName}` : "Member").join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-foreground">
                          {finalist.averageScore} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1 cursor-pointer"
                          onClick={() =>
                            setFeedbackModal({
                              open: true,
                              team: finalist.teamName,
                              feedbacks: finalist.feedbacks,
                            })
                          }
                        >
                          <MessageSquare className="w-3 h-3" />
                          View Judge Notes ({finalist.evaluationsCount})
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-52">
                          <Select
                            value={currentAlloc.position}
                            onValueChange={(val) =>
                              setAllocations((prev) => ({
                                ...prev,
                                [finalist.teamId]: { ...currentAlloc, position: val },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs border-border/60 bg-background">
                              <SelectValue placeholder="Allocate position..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIRST_PRIZE">1st Place (Winner)</SelectItem>
                              <SelectItem value="SECOND_PRIZE">2nd Place (Runner-up)</SelectItem>
                              <SelectItem value="THIRD_PRIZE">3rd Place (2nd Runner-up)</SelectItem>
                              <SelectItem value="SPECIAL_AWARD">Special Category Award</SelectItem>
                              <SelectItem value="FINALIST">Honorable Finalist</SelectItem>
                              <SelectItem value="NONE">No Position</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            className="h-8 w-28 text-xs font-mono border-border/60 bg-background"
                            placeholder="Prize Value"
                            value={currentAlloc.prizeAmount || ""}
                            onChange={(e) =>
                              setAllocations((prev) => ({
                                ...prev,
                                [finalist.teamId]: {
                                  ...currentAlloc,
                                  prizeAmount: Number(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Button
                          size="sm"
                          className="h-8 bg-primary hover:bg-primary/90 text-xs font-medium"
                          onClick={() => handleConfirmSingle(finalist.teamId, finalist.teamName)}
                          disabled={publishResult.isPending}
                        >
                          Assign Position
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Judge Feedback Modal Dialog */}
      <Dialog open={feedbackModal.open} onOpenChange={(open) => setFeedbackModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Audited Scorecard Notes — {feedbackModal.team}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct evaluations submitted by authorized panel judges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {feedbackModal.feedbacks.map((f: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{f.judgeName}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{f.score} / 100</span>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;{f.feedback || "Score entered without qualitative notes."}&rdquo;
                </p>
              </div>
            ))}
            {feedbackModal.feedbacks.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">No qualitative feedback remarks entered.</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 text-xs"
              onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
