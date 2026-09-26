import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useCreateManagerEvent, useUpdateManagerEvent } from "../hooks/manager.api";
import { ApiEvent } from "@/modules/events/services/events.api";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

type RoundItem = {
  id?: string | undefined;
  roundNumber: number;
  name: string;
  description: string;
  maxMarks: number;
  submissionStart?: string | undefined;
  submissionDeadline?: string | undefined;
};

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: ApiEvent | null;
}

export function ManagerEventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [facultyCoordinatorId, setFacultyCoordinatorId] = useState<string>("none");
  const [rounds, setRounds] = useState<RoundItem[]>([]);

  const { user } = useAuth();

  const createMutation = useCreateManagerEvent();
  const updateMutation = useUpdateManagerEvent();
  const isEditing = !!event;

  const { data: members = [] } = useQuery({
    queryKey: ['coordinators', user?.memberships?.[0]?.organization?.id],
    queryFn: async () => {
      const orgId = user?.memberships?.[0]?.organization?.id;
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data;
    },
    enabled: !!user?.memberships?.[0]?.organization?.id,
  });

  const facultyCoordinators = members.filter((m: any) => m.role?.name === "Faculty Coordinator" && m.status === "ACTIVE");

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDescription(event.description ?? "");
      setStartTime(event.startTime.slice(0, 16));
      setEndTime(event.endTime.slice(0, 16));
      setStatus(event.status);
      const fc = event.teamMembers?.find((tm: any) => tm.responsibility === "Faculty Coordinator");
      setFacultyCoordinatorId(fc ? fc.userId : "none");
      if (event.rounds && Array.isArray(event.rounds) && event.rounds.length > 0) {
        setRounds(
          event.rounds.map((r: any) => ({
            id: r.id,
            roundNumber: r.roundNumber,
            name: r.name,
            description: r.description ?? "",
            maxMarks: r.maxMarks ?? 100,
            submissionStart: r.submissionStart ? r.submissionStart.slice(0, 16) : "",
            submissionDeadline: r.submissionDeadline ? r.submissionDeadline.slice(0, 16) : "",
          }))
        );
      } else {
        setRounds([
          { roundNumber: 1, name: "Qualifier Round", description: "Initial screening round", maxMarks: 100, submissionStart: "", submissionDeadline: "" }
        ]);
      }
    } else {
      setName("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setStatus("DRAFT");
      setFacultyCoordinatorId("none");
      setRounds([
        { roundNumber: 1, name: "Qualifier Round", description: "Initial screening round", maxMarks: 100, submissionStart: "", submissionDeadline: "" }
      ]);
    }
  }, [event, open]);

  const handleAddRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        roundNumber: prev.length + 1,
        name: `Round ${prev.length + 1}`,
        description: "",
        maxMarks: 100,
        submissionStart: "",
        submissionDeadline: "",
      },
    ]);
  };

  const handleRemoveRound = (index: number) => {
    setRounds((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((r, i) => ({ ...r, roundNumber: i + 1 }));
    });
  };

  const handleRoundChange = (index: number, field: keyof RoundItem, value: any) => {
    setRounds((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      if (!cur) return prev;
      const updated: RoundItem = {
        id: cur.id,
        roundNumber: field === "roundNumber" ? Number(value) : cur.roundNumber,
        name: field === "name" ? String(value) : cur.name,
        description: field === "description" ? String(value) : cur.description,
        maxMarks: field === "maxMarks" ? Number(value) : cur.maxMarks,
        submissionStart: field === "submissionStart" ? String(value) : cur.submissionStart,
        submissionDeadline: field === "submissionDeadline" ? String(value) : cur.submissionDeadline,
      };
      copy[index] = updated;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const r of rounds) {
        if (!r.name || !r.name.trim()) {
          toast.error(`Round ${r.roundNumber}: Round name is required.`);
          return;
        }
        if (!r.maxMarks || Number(r.maxMarks) <= 0) {
          toast.error(`Round ${r.roundNumber} (${r.name}): Maximum marks must be greater than 0.`);
          return;
        }
        if (r.submissionStart && r.submissionDeadline) {
          const start = new Date(r.submissionStart);
          const deadline = new Date(r.submissionDeadline);
          if (deadline < start) {
            toast.error(`Round ${r.roundNumber} (${r.name}): Submission deadline cannot be before submission start.`);
            return;
          }
        }
      }

      const payload = {
        name,
        ...(description ? { description } : {}),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status,
        ...(facultyCoordinatorId !== "none" ? { facultyCoordinatorId } : {}),
        rounds: rounds.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          roundNumber: Number(r.roundNumber || 1),
          name: String(r.name || "Round"),
          description: String(r.description || ""),
          maxMarks: Number(r.maxMarks || 100),
          ...(r.submissionStart ? { submissionStart: new Date(r.submissionStart).toISOString() } : {}),
          ...(r.submissionDeadline ? { submissionDeadline: new Date(r.submissionDeadline).toISOString() } : {}),
        })),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: event.id, data: payload });
        toast.success("Event updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Event created successfully");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message ?? "Failed to save event");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update event details." : "Create a new event under this organization."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ev-name">Name</Label>
              <Input id="ev-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Global AI Hackathon" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ev-desc">Description</Label>
              <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the event..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ev-start">Start time</Label>
                <Input id="ev-start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ev-end">End time</Label>
                <Input id="ev-end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ev-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="ev-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ev-fc">Faculty Coordinator</Label>
              <Select value={facultyCoordinatorId} onValueChange={setFacultyCoordinatorId}>
                <SelectTrigger id="ev-fc"><SelectValue placeholder="Assign coordinator..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {facultyCoordinators.map((fc: any) => (
                    <SelectItem key={fc.userId} value={fc.userId}>
                      {fc.user?.firstName} {fc.user?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EVENT ROUNDS CONFIGURATION SECTION */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-foreground uppercase">Event Rounds</h4>
                  <p className="text-[11px] text-muted-foreground">Configure competition rounds, maximum marks, and submission deadlines.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRound} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Round
                </Button>
              </div>

              {rounds.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No rounds configured. Click "+ Add Round" to create one.</p>
              ) : (
                <div className="space-y-3">
                  {rounds.map((rd, index) => (
                    <div key={index} className="p-3.5 rounded-lg border bg-muted/20 space-y-3 relative">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-semibold text-xs text-primary">Round {rd.roundNumber}</span>
                        {rounds.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRound(index)}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Remove Round
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label className="text-[11px] font-medium">Round Name</Label>
                          <Input
                            className="text-xs h-8"
                            placeholder="e.g. Idea Submission"
                            value={rd.name}
                            onChange={(e) => handleRoundChange(index, "name", e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid gap-1">
                          <Label className="text-[11px] font-medium">Maximum Marks</Label>
                          <Input
                            className="text-xs h-8 font-mono"
                            type="number"
                            min={1}
                            max={1000}
                            placeholder="100"
                            value={rd.maxMarks}
                            onChange={(e) => handleRoundChange(index, "maxMarks", Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-1">
                        <Label className="text-[11px] font-medium">Description</Label>
                        <Textarea
                          className="text-xs resize-y"
                          rows={2}
                          placeholder="Describe round objectives, guidelines, or instructions..."
                          value={rd.description}
                          onChange={(e) => handleRoundChange(index, "description", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label className="text-[11px] font-medium">Submission Start</Label>
                          <Input
                            className="text-xs h-8"
                            type="datetime-local"
                            value={rd.submissionStart || ""}
                            onChange={(e) => handleRoundChange(index, "submissionStart", e.target.value)}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[11px] font-medium">Submission Deadline</Label>
                          <Input
                            className="text-xs h-8"
                            type="datetime-local"
                            value={rd.submissionDeadline || ""}
                            onChange={(e) => handleRoundChange(index, "submissionDeadline", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

