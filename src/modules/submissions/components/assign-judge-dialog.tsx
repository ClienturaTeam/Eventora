import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useAssignJudge, useUnassignJudge, ApiSubmission } from "../services/submissions.api";
import { toast } from "sonner";
import { UserCheck, Trash2, Layers, Trophy } from "lucide-react";

interface AssignJudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: ApiSubmission | null;
}

export function AssignJudgeDialog({ open, onOpenChange, submission }: AssignJudgeDialogProps) {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organization?.id || (user as any)?.organizationId;

  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const assignJudgeMutation = useAssignJudge();
  const unassignJudgeMutation = useUnassignJudge();

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
    if (!submission || !selectedJudgeId) return;
    try {
      await assignJudgeMutation.mutateAsync({
        submissionId: submission.id,
        judgeId: selectedJudgeId,
      });
      toast.success("Judge successfully assigned!");
      setSelectedJudgeId("");
    } catch (e: any) {
      toast.error(e.message || "Failed to assign judge");
    }
  };

  const handleUnassign = async (judgeId: string) => {
    if (!submission) return;
    try {
      await unassignJudgeMutation.mutateAsync({
        submissionId: submission.id,
        judgeId,
      });
      toast.success("Judge assignment removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to unassign judge");
    }
  };

  if (!submission) return null;

  const assignedJudgeIds = new Set(submission.judgeAssignments?.map((a) => a.judge.id) || []);

  // Combine judges profiles and organization members
  const candidateMap = new Map<string, { id: string; name: string; email: string; roleName: string }>();
  
  members.forEach((m: any) => {
    if (m.user && !assignedJudgeIds.has(m.user.id)) {
      candidateMap.set(m.user.id, {
        id: m.user.id,
        name: `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim() || m.user.email,
        email: m.user.email,
        roleName: m.role?.name || "Member",
      });
    }
  });

  judgesList.forEach((j: any) => {
    const userId = j.userId || j.user?.id;
    if (userId && !assignedJudgeIds.has(userId) && !candidateMap.has(userId)) {
      const name = j.user ? `${j.user.firstName || ""} ${j.user.lastName || ""}`.trim() : "Judge";
      candidateMap.set(userId, {
        id: userId,
        name: name || j.user?.email || "Judge Profile",
        email: j.user?.email || "",
        roleName: "Judge",
      });
    }
  });

  const availableJudges = Array.from(candidateMap.values());
  const eventName = submission.event?.name || submission.competition?.event?.name || "General Event";
  const roundName = submission.eventRound
    ? `Round ${submission.eventRound.roundNumber} — ${submission.eventRound.name}`
    : `Round ${submission.roundNumber || 1}`;

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
            <div className="font-semibold text-sm text-foreground">{submission.title}</div>
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
            {submission.team && (
              <div className="text-muted-foreground pt-1 border-t border-border/50">
                Team: <span className="font-medium text-foreground">{submission.team.name}</span>
              </div>
            )}
          </div>

          {/* Currently Assigned Judges List */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Assigned Judges ({submission.judgeAssignments?.length || 0})</Label>
            {(!submission.judgeAssignments || submission.judgeAssignments.length === 0) ? (
              <p className="text-xs text-muted-foreground italic p-2 rounded border border-dashed text-center">
                No judges assigned to this submission yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {submission.judgeAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{a.judge.firstName} {a.judge.lastName}</span>
                      <span className="text-muted-foreground ml-1.5 text-[11px]">({a.judge.email})</span>
                      <Badge variant="secondary" className="ml-2 text-[9px] py-0 px-1">Assigned</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleUnassign(a.judge.id)}
                      disabled={unassignJudgeMutation.isPending}
                      title="Remove judge assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Judge Selection */}
          <div className="space-y-2 pt-3 border-t border-border">
            <Label className="text-xs font-semibold">Assign New Judge</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                <SelectTrigger className="h-9 text-xs flex-1">
                  <SelectValue placeholder="Select an authorized judge..." />
                </SelectTrigger>
                <SelectContent>
                  {availableJudges.map((j) => (
                    <SelectItem key={j.id} value={j.id} className="text-xs">
                      {j.name} ({j.email}) — <span className="text-muted-foreground">{j.roleName}</span>
                    </SelectItem>
                  ))}
                  {availableJudges.length === 0 && (
                    <SelectItem value="none" disabled className="text-xs">
                      All organization judges/members are already assigned
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 text-xs"
                onClick={handleAssign}
                disabled={!selectedJudgeId || assignJudgeMutation.isPending}
              >
                {assignJudgeMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
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
