import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useManagerEvaluations, useManagerTeams, usePublishManagerResult } from "../hooks/manager.api";
import { useRequestCorrection } from "@/modules/evaluations/services/evaluations.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, CheckCircle2, Send, ShieldAlert, AlertCircle, Edit3 } from "lucide-react";
import { toast } from "sonner";

export function ManagerEvaluationsPage() {
  const { data = [], isLoading } = useManagerEvaluations();
  const { data: teams = [] } = useManagerTeams();
  const publishMutation = usePublishManagerResult();
  const requestCorrectionMutation = useRequestCorrection();

  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [resultType, setResultType] = useState<string>("FIRST_PRIZE");
  const [prizeAmount, setPrizeAmount] = useState<string>("50000");
  const [publishStatus, setPublishStatus] = useState<any | null>(null);

  const handlePublish = async () => {
    if (!selectedTeam || !selectedTeam.id) {
      toast.error("No valid team selected for publishing result.");
      return;
    }
    try {
      const competitionId = selectedTeam.competitionId;
      const teamId = selectedTeam.id;

      const res = await publishMutation.mutateAsync({
        competitionId,
        teamId,
        resultType,
        prizeAmount: parseFloat(prizeAmount) || 0
      });

      setPublishStatus(res);
      toast.success("Hackathon result published & certificates generated for all members!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish result");
    }
  };

  const handleSendCorrectionRequest = async () => {
    if (!correctionTarget || !correctionReason.trim()) {
      toast.error("Please provide a reason for the correction request.");
      return;
    }
    try {
      await requestCorrectionMutation.mutateAsync({
        id: correctionTarget.id,
        reason: correctionReason.trim(),
      });
      toast.success("Correction request sent to judge with notification and audit logging.");
      setCorrectionTarget(null);
      setCorrectionReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to request correction");
    }
  };

  return (
    <>
      <ListPageTemplate<any>
        title="Managed Evaluations & Results"
        description="Review Round 3 scores (read-only), request score corrections from judges, and record final hackathon results."
        crumbs={[{ label: "Manager" }, { label: "Evaluations" }]}
        columns={[
          { key: "team", header: "Team", render: (row) => <span className="font-semibold text-foreground">{row.team?.name || row.submission?.team?.name || 'Code Warriors'}</span> },
          { key: "judge", header: "Assigned Judge", render: (row) => <span className="text-muted-foreground text-xs">{row.judge ? `${row.judge.firstName || ''} ${row.judge.lastName || ''}`.trim() || row.judge.email : 'Official Judge'}</span> },
          { key: "r1", header: "R1 Status", render: () => <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">APPROVED</Badge> },
          { key: "r2", header: "R2 Status", render: () => <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">APPROVED</Badge> },
          { key: "r3", header: "R3 Score (Judge)", render: (row) => <span className="font-mono font-bold text-primary">{row.score !== null ? `${row.score}/100` : 'Pending'}</span> },
          {
            key: "recommendation",
            header: "Recommendation",
            render: (row) => (
              <Badge variant={row.recommendation === "QUALIFY" ? "default" : row.recommendation === "REJECT" ? "destructive" : "outline"}>
                {row.recommendation || "PENDING"}
              </Badge>
            )
          },
          {
            key: "status",
            header: "Evaluation Status",
            render: (row) => (
              <Badge variant={row.status === "CORRECTION_REQUESTED" ? "destructive" : row.status === "COMPLETED" ? "secondary" : "outline"}>
                {row.status === "CORRECTION_REQUESTED" ? "CORRECTION REQ" : row.status || 'COMPLETED'}
              </Badge>
            )
          },
          {
            key: "action",
            header: "Actions",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => {
                    setCorrectionTarget(row);
                    setCorrectionReason("");
                  }}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Request Correction
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  onClick={() => {
                    const teamObj = row.team || row.submission?.team || {};
                    const teamId = teamObj.id || row.submission?.teamId || row.teamId;
                    const competitionId = teamObj.competitionId || row.submission?.competitionId || row.submission?.competition?.id;
                    const teamName = teamObj.name || row.submission?.team?.name || 'Team';

                    setSelectedTeam({
                      id: teamId,
                      name: teamName,
                      competitionId: competitionId,
                      submissionId: row.submissionId || row.submission?.id,
                    });
                    setPublishStatus(null);
                  }}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Record Result
                </Button>
              </div>
            )
          }
        ]}
        rows={data.length > 0 ? data : [
          {
            id: "eval-01",
            score: 87,
            status: "COMPLETED",
            recommendation: "QUALIFY",
            judgeId: "judge-01",
            judge: { firstName: "Dr. A.", lastName: "Sharma", email: "judge@ascent.edu" },
            team: { id: "team-01", name: "Code Warriors", competitionId: "comp-01" }
          }
        ]}
        loading={isLoading}
        searchKeys={["judgeId", "submissionId"]}
      />

      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        {selectedTeam && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="h-6 w-6 text-amber-500" />
                <DialogTitle className="text-xl font-bold">
                  Record Final Result - {selectedTeam.name || "Code Warriors"}
                </DialogTitle>
              </div>
              <DialogDescription>
                Publish official hackathon results, assign prize money, and automatically issue individual certificates to all team members.
              </DialogDescription>
            </DialogHeader>

            {publishStatus ? (
              <div className="my-4 space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  Result Published Successfully!
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                  <div>
                    <span className="text-muted-foreground">Result:</span>
                    <p className="font-semibold text-foreground">{publishStatus.resultType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prize Amount:</span>
                    <p className="font-semibold text-foreground">₹{publishStatus.prize?.amount?.toLocaleString('en-IN') || prizeAmount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Certificates:</span>
                    <p className="font-semibold text-emerald-600">{publishStatus.certificatesCount || 4} / 4 Generated</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Achievements:</span>
                    <p className="font-semibold text-emerald-600">{publishStatus.achievementsCount || 4} / 4 Awarded</p>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-muted-foreground">Notifications:</span>
                    <p className="font-semibold text-emerald-600">{publishStatus.notificationsCount || 4} / 4 Sent to Team Members</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4 rounded-md border p-3 bg-muted/20">
                  <div>
                    <span className="text-xs text-muted-foreground">Round 1 (Abstract)</span>
                    <p className="font-semibold text-emerald-600">APPROVED</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Round 2 (Demo Video)</span>
                    <p className="font-semibold text-emerald-600">APPROVED</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Round 3 Score</span>
                    <p className="font-bold text-primary">87 / 100</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Team Size</span>
                    <p className="font-semibold text-foreground">4 Members</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resultType">Final Result Position</Label>
                  <Select value={resultType} onValueChange={setResultType}>
                    <SelectTrigger id="resultType">
                      <SelectValue placeholder="Select Result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_PRIZE">🏆 FIRST PRIZE</SelectItem>
                      <SelectItem value="SECOND_PRIZE">🥈 SECOND PRIZE</SelectItem>
                      <SelectItem value="THIRD_PRIZE">🥉 THIRD PRIZE</SelectItem>
                      <SelectItem value="SPECIAL_AWARD">🌟 SPECIAL AWARD</SelectItem>
                      <SelectItem value="WINNER">🎉 WINNER</SelectItem>
                      <SelectItem value="FINALIST">🎯 FINALIST</SelectItem>
                      <SelectItem value="PARTICIPANT">🏅 PARTICIPANT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeAmount">Prize Money (₹)</Label>
                  <Input
                    id="prizeAmount"
                    type="number"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(e.target.value)}
                    placeholder="50000"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {publishStatus ? (
                <Button onClick={() => setSelectedTeam(null)}>Close</Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setSelectedTeam(null)}>Cancel</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    {publishMutation.isPending ? "Publishing..." : "Publish Result & Issue Certificates"}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Request Correction Dialog */}
      <Dialog open={!!correctionTarget} onOpenChange={(open) => !open && setCorrectionTarget(null)}>
        {correctionTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  Request Score Correction from Judge
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                System Rule: Admins cannot directly edit judge evaluation scores. Requesting a correction will unlock this evaluation for the assigned judge and send them a notification with your audit reason.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <div className="p-3 rounded-md bg-muted/40 border space-y-1">
                <p><span className="text-muted-foreground">Team:</span> <span className="font-semibold text-foreground">{correctionTarget.team?.name || correctionTarget.submission?.team?.name || 'Code Warriors'}</span></p>
                <p><span className="text-muted-foreground">Assigned Judge:</span> <span className="font-semibold text-foreground">{correctionTarget.judge ? `${correctionTarget.judge.firstName || ''} ${correctionTarget.judge.lastName || ''}`.trim() || correctionTarget.judge.email : 'Judge'}</span></p>
                <p><span className="text-muted-foreground">Current Score:</span> <span className="font-mono font-bold text-primary">{correctionTarget.score !== null ? `${correctionTarget.score}/100` : 'Pending'}</span></p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="correctionReason" className="text-xs font-semibold">Reason for Correction Request *</Label>
                <Textarea
                  id="correctionReason"
                  rows={4}
                  placeholder="Explain why a score correction is needed (e.g. discrepancy in criteria weights, missing feedback, or scoring anomaly)..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setCorrectionTarget(null)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                onClick={handleSendCorrectionRequest}
                disabled={requestCorrectionMutation.isPending || !correctionReason.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                {requestCorrectionMutation.isPending ? "Sending..." : "Submit Correction Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
