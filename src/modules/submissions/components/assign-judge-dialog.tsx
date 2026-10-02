import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useAssignJudge, useUnassignJudge, useSubmission, ApiSubmission } from "../services/submissions.api";
import { toast } from "sonner";
import { UserCheck, Trash2, Layers, Trophy, Loader2 } from "lucide-react";

interface AssignJudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: ApiSubmission | null;
}

export function AssignJudgeDialog({ open, onOpenChange, submission }: AssignJudgeDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.memberships?.[0]?.organization?.id || (user as any)?.organizationId;

  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const assignJudgeMutation = useAssignJudge();
  const unassignJudgeMutation = useUnassignJudge();

  // Fetch real-time fresh submission details including latest judgeAssignments from backend
  const {
    data: freshSubmission,
    refetch: refetchSubmission,
    isLoading: loadingFreshSub
  } = useSubmission(open && submission?.id ? submission.id : "");

  const currentSubmission = freshSubmission || submission;

  // Refetch latest submission data whenever dialog opens
  useEffect(() => {
    if (open && submission?.id) {
      refetchSubmission();
      setSelectedJudgeId("");
    }
  }, [open, submission?.id, refetchSubmission]);

  // Load organization members / judges from backend
  const { data: members = [] } = useQuery({
    queryKey: ["organization", orgId, "members"],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data as any[];
    },
    enabled: !!orgId && open,
  });

  const { data: judgesList = [] } = useQuery({
    queryKey: ["judges"],
    queryFn: async () => {
      const res = await fetchApi("/judges");
      return res.data as any[];
    },
    enabled: open,
  });

  const handleAssign = async () => {
    if (!currentSubmission || !selectedJudgeId) return;
    try {
      await assignJudgeMutation.mutateAsync({
        submissionId: currentSubmission.id,
        judgeId: selectedJudgeId,
      });
      toast.success("Judge successfully assigned!");
      setSelectedJudgeId("");
      await refetchSubmission();
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", currentSubmission.id] });
    } catch (e: any) {
      toast.error(e?.message || e?.details?.[0] || "Failed to assign judge");
    }
  };

  const handleUnassign = async (judgeId: string) => {
    if (!currentSubmission) return;
    try {
      await unassignJudgeMutation.mutateAsync({
        submissionId: currentSubmission.id,
        judgeId,
      });
      toast.success("Judge assignment removed");
      await refetchSubmission();
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", currentSubmission.id] });
    } catch (e: any) {
      toast.error(e?.message || e?.details?.[0] || "Failed to unassign judge");
    }
  };

  if (!currentSubmission) return null;

  const assignedJudges = currentSubmission.judgeAssignments || [];
  const assignedJudgeIds = new Set(
    assignedJudges.map((a) => a.judge?.id || (a as any).judgeId).filter(Boolean)
  );

  // Combine judges profiles and organization members excluding already-assigned judges
  const candidateMap = new Map<string, { id: string; name: string; email: string; roleName: string }>();
  
  members.forEach((m: any) => {
    const userId = m.user?.id || m.userId;
    if (userId && !assignedJudgeIds.has(userId)) {
      candidateMap.set(userId, {
        id: userId,
        name: `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim() || m.user?.email || "Member",
        email: m.user?.email || "",
        roleName: m.role?.name || "Member",
      });
    }
  });

  judgesList.forEach((j: any) => {
    const userId = j.userId || j.user?.id || j.id;
    if (userId && !assignedJudgeIds.has(userId) && !candidateMap.has(userId)) {
      const name = j.user ? `${j.user.firstName || ""} ${j.user.lastName || ""}`.trim() : (j.name || "Judge");
      candidateMap.set(userId, {
        id: userId,
        name: name || j.user?.email || "Judge Profile",
        email: j.user?.email || j.email || "",
        roleName: "Judge",
      });
    }
  });

  const availableJudges = Array.from(candidateMap.values());
  const eventName = currentSubmission.event?.name || currentSubmission.competition?.event?.name || "General Event";
  const roundName = currentSubmission.eventRound
    ? `Round ${currentSubmission.eventRound.roundNumber} — ${currentSubmission.eventRound.name}`
    : `Round ${currentSubmission.roundNumber || 1}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Assign Judge to Submission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Submission Context Box */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2 text-xs">
            <div className="font-semibold text-sm text-foreground">{currentSubmission.title}</div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>
                <span className="block text-[10px]">Event</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  {eventName}
                </span>
              </div>
              <div>
                <span className="block text-[10px]">Round</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-500" />
                  {roundName}
                </span>
              </div>
            </div>
            {currentSubmission.team && (
              <div className="text-muted-foreground pt-1 border-t border-border/50">
                Team: <span className="font-medium text-foreground">{currentSubmission.team.name}</span>
              </div>
            )}
          </div>

          {/* Currently Assigned Judges List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Assigned Judges ({assignedJudges.length})
              </Label>
              {loadingFreshSub && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>

            {assignedJudges.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-3 rounded-md border border-dashed text-center bg-muted/10">
                No judges assigned to this submission yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {assignedJudges.map((a) => {
                  const judgeName = `${a.judge?.firstName || ""} ${a.judge?.lastName || ""}`.trim() || (a.judge as any)?.name || "Judge";
                  const judgeEmail = a.judge?.email;
                  return (
                    <div key={a.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">{judgeName}</span>
                        {judgeEmail && (
                          <span className="text-muted-foreground text-[11px]">({judgeEmail})</span>
                        )}
                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Assigned
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleUnassign(a.judge?.id || (a as any).judgeId)}
                        disabled={unassignJudgeMutation.isPending}
                        title="Remove judge assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Judge Selection */}
          <div className="space-y-2 pt-3 border-t border-border">
            <Label className="text-xs font-semibold">Assign New Judge</Label>
            {availableJudges.length > 0 ? (
              <div className="flex items-center gap-2">
                <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Select an authorized judge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableJudges.map((j) => (
                      <SelectItem key={j.id} value={j.id} className="text-xs">
                        {j.name} {j.email ? `(${j.email})` : ""} — <span className="text-muted-foreground">{j.roleName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-9 text-xs shrink-0"
                  onClick={handleAssign}
                  disabled={!selectedJudgeId || assignJudgeMutation.isPending}
                >
                  {assignJudgeMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            ) : (
              <div className="p-2.5 rounded-md border border-dashed text-xs text-muted-foreground bg-muted/20 text-center">
                All available judges are already assigned.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
