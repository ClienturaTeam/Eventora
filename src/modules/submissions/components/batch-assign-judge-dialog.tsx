import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useAssignJudge, ApiSubmission } from "../services/submissions.api";
import { toast } from "sonner";
import { UserCheck, Layers } from "lucide-react";

interface BatchAssignJudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubmissions: ApiSubmission[];
  onSuccess: () => void;
}

export function BatchAssignJudgeDialog({
  open,
  onOpenChange,
  selectedSubmissions,
  onSuccess,
}: BatchAssignJudgeDialogProps) {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organization?.id || (user as any)?.organizationId;

  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const assignJudgeMutation = useAssignJudge();

  // Load organization members & judges from backend
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

  // Combine unique eligible judges from both judges table and org members with judge roles
  const judgeMap = new Map<string, { id: string; name: string; email: string; roleName: string }>();

  judgesList.forEach((j: any) => {
    const targetId = j.userId || j.user?.id || j.id;
    const name = j.user
      ? `${j.user.firstName || ""} ${j.user.lastName || ""}`.trim()
      : j.name || "Judge";
    const email = j.user?.email || j.email || "";
    judgeMap.set(targetId, {
      id: targetId,
      name: name || email || "Judge Profile",
      email,
      roleName: "Judge",
    });
  });

  members.forEach((m: any) => {
    const roleName = m.role?.name || "";
    if (m.user && (roleName.toLowerCase().includes("judge") || !judgeMap.has(m.user.id))) {
      const existing = judgeMap.get(m.user.id);
      if (!existing && roleName.toLowerCase().includes("judge")) {
        judgeMap.set(m.user.id, {
          id: m.user.id,
          name: `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim() || m.user.email,
          email: m.user.email,
          roleName: m.role?.name || "Member",
        });
      }
    }
  });

  const availableJudges = Array.from(judgeMap.values());

  const handleAssign = async () => {
    if (!selectedJudgeId || selectedSubmissions.length === 0) return;
    setIsSubmitting(true);
    let successCount = 0;
    let failedCount = 0;
    let lastErrorMsg = "";

    try {
      for (const sub of selectedSubmissions) {
        try {
          await assignJudgeMutation.mutateAsync({
            submissionId: sub.id,
            judgeId: selectedJudgeId,
          });
          successCount++;
        } catch (err: any) {
          failedCount++;
          lastErrorMsg = err?.message || "Failed to assign";
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully assigned judge to ${successCount} submission${successCount > 1 ? "s" : ""}!`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to assign ${failedCount} submission(s): ${lastErrorMsg}`);
      }

      setSelectedJudgeId("");
      onSuccess();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Assign Selected Submissions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Selected submissions:</span>
              <Badge variant="default" className="text-xs font-semibold px-2 py-0.5">
                {selectedSubmissions.length}
              </Badge>
            </div>

            {/* List preview of selected submissions */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
              {selectedSubmissions.map((s) => (
                <div key={s.id} className="text-xs p-1.5 rounded bg-background border flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="font-semibold block truncate">{s.team?.name || s.title}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      {s.eventRound ? `Round ${s.eventRound.roundNumber} — ${s.eventRound.name}` : `Round ${s.roundNumber || 1}`}
                    </span>
                  </div>
                  {s.judgeAssignments && s.judgeAssignments.length > 0 ? (
                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      {s.judgeAssignments.length} Judge(s)
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic shrink-0">Unassigned</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Judge</Label>
            <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="[ Select Judge ▼ ]" />
              </SelectTrigger>
              <SelectContent>
                {availableJudges.map((j) => (
                  <SelectItem key={j.id} value={j.id} className="text-xs">
                    {j.name} ({j.email})
                  </SelectItem>
                ))}
                {availableJudges.length === 0 && (
                  <SelectItem value="none" disabled className="text-xs">
                    No eligible judges found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedJudgeId || isSubmitting || selectedSubmissions.length === 0}
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
