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
import { Plus, Trash2, AlertCircle } from "lucide-react";
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
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
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
      setStartTime(event.startTime ? event.startTime.slice(0, 16) : "");
      setEndTime(event.endTime ? event.endTime.slice(0, 16) : "");
      setStatus(event.status);
      setMinTeamSize(event.minTeamSize ?? 2);
      setMaxTeamSize(event.maxTeamSize ?? 4);
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
      setMinTeamSize(2);
      setMaxTeamSize(4);
      setFacultyCoordinatorId("none");
      setRounds([
        { roundNumber: 1, name: "Qualifier Round", description: "Initial screening round", maxMarks: 100, submissionStart: "", submissionDeadline: "" }
      ]);
    }
  }, [event, open]);

  // Master date window validity checks
  const eventStartObj = startTime ? new Date(startTime) : null;
  const eventEndObj = endTime ? new Date(endTime) : null;
  const isEventStartValid = eventStartObj && !isNaN(eventStartObj.getTime());
  const isEventEndValid = eventEndObj && !isNaN(eventEndObj.getTime());

  const isEventEndBeforeStart =
    isEventStartValid && isEventEndValid && eventEndObj.getTime() <= eventStartObj.getTime();

  const hasValidEventDates = isEventStartValid && isEventEndValid && !isEventEndBeforeStart;

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

  // Helper to compute live validation errors for a specific round
  const getRoundErrors = (index: number, rd: RoundItem): string[] => {
    if (!hasValidEventDates || !rd) return [];
    const errors: string[] = [];
    const rStart = rd.submissionStart ? new Date(rd.submissionStart) : null;
    const rDeadline = rd.submissionDeadline ? new Date(rd.submissionDeadline) : null;

    // Check bounds against event window
    if (rStart && eventStartObj && eventEndObj) {
      if (rStart.getTime() < eventStartObj.getTime() || rStart.getTime() > eventEndObj.getTime()) {
        errors.push(`Round ${rd.roundNumber} submission start must fall within event start and end time.`);
      }
    }

    if (rDeadline && eventStartObj && eventEndObj) {
      if (rDeadline.getTime() < eventStartObj.getTime() || rDeadline.getTime() > eventEndObj.getTime()) {
        errors.push(`Round ${rd.roundNumber} submission deadline must fall within event start and end time.`);
      }
    }

    // Check start < deadline
    if (rStart && rDeadline) {
      if (rStart.getTime() >= rDeadline.getTime()) {
        errors.push("Round deadline must be after the submission start time.");
      }
    }

    // Check chronological ordering relative to previous round
    if (index > 0 && rStart) {
      const prevRd = rounds[index - 1];
      if (prevRd && prevRd.submissionDeadline) {
        const prevDeadline = new Date(prevRd.submissionDeadline);
        if (rStart.getTime() < prevDeadline.getTime()) {
          errors.push(`Round ${rd.roundNumber} must start after Round ${prevRd.roundNumber} ends.`);
        }
      }
    }

    // Check overlap with all other rounds
    for (let j = 0; j < rounds.length; j++) {
      if (j === index) continue;
      const other = rounds[j];
      if (!other) continue;
      const otherStart = other.submissionStart ? new Date(other.submissionStart) : null;
      const otherDeadline = other.submissionDeadline ? new Date(other.submissionDeadline) : null;

      if (rStart && rDeadline && otherStart && otherDeadline) {
        if (rStart.getTime() < otherDeadline.getTime() && otherStart.getTime() < rDeadline.getTime()) {
          errors.push(`Round ${rd.roundNumber} schedule overlaps with Round ${other.roundNumber}.`);
        }
      }
    }

    return Array.from(new Set(errors));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!startTime || !endTime) {
        toast.error("Event start time and end time are required.");
        return;
      }

      if (isEventEndBeforeStart) {
        toast.error("Event end time must be after event start time.");
        return;
      }

      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        if (!r) continue;
        if (!r.name || !r.name.trim()) {
          toast.error(`Round ${r.roundNumber}: Round name is required.`);
          return;
        }
        if (!r.maxMarks || Number(r.maxMarks) <= 0) {
          toast.error(`Round ${r.roundNumber} (${r.name}): Maximum marks must be greater than 0.`);
          return;
        }

        const roundErrs = getRoundErrors(i, r);
        if (roundErrs.length > 0) {
          toast.error(roundErrs[0]);
          return;
        }
      }

      if (Number(minTeamSize) < 1) {
        toast.error("Minimum team participants must be at least 1.");
        return;
      }
      if (Number(maxTeamSize) < Number(minTeamSize)) {
        toast.error("Maximum team participants must be greater than or equal to minimum team participants.");
        return;
      }

      const payload = {
        name,
        ...(description ? { description } : {}),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        registrationType: "TEAM",
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

            {isEventEndBeforeStart && (
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Event end time must be after event start time.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ev-min-team-size">Minimum Team Participants</Label>
                  <Select value={String(minTeamSize)} onValueChange={(val) => setMinTeamSize(Number(val))}>
                    <SelectTrigger id="ev-min-team-size"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Participant</SelectItem>
                      <SelectItem value="2">2 Participants</SelectItem>
                      <SelectItem value="3">3 Participants</SelectItem>
                      <SelectItem value="4">4 Participants</SelectItem>
                      <SelectItem value="5">5 Participants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ev-max-team-size">Maximum Team Participants</Label>
                  <Select value={String(maxTeamSize)} onValueChange={(val) => setMaxTeamSize(Number(val))}>
                    <SelectTrigger id="ev-max-team-size"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Participants</SelectItem>
                      <SelectItem value="3">3 Participants</SelectItem>
                      <SelectItem value="4">4 Participants</SelectItem>
                      <SelectItem value="5">5 Participants</SelectItem>
                      <SelectItem value="6">6 Participants</SelectItem>
                      <SelectItem value="7">7 Participants</SelectItem>
                      <SelectItem value="8">8 Participants</SelectItem>
                      <SelectItem value="10">10 Participants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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

              {!hasValidEventDates ? (
                <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Select the event start and end time first to configure round schedules.</span>
                </div>
              ) : null}

              {rounds.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No rounds configured. Click "+ Add Round" to create one.</p>
              ) : (
                <div className="space-y-3">
                  {rounds.map((rd, index) => {
                    const roundErrs = getRoundErrors(index, rd);
                    const prevDeadline = index > 0 && rounds[index - 1]?.submissionDeadline ? rounds[index - 1]?.submissionDeadline : "";
                    const nextStart = index < rounds.length - 1 && rounds[index + 1]?.submissionStart ? rounds[index + 1]?.submissionStart : "";

                    // Compute dynamic min/max for start picker
                    const startMin = prevDeadline && prevDeadline > startTime ? prevDeadline : startTime;
                    const startMax = endTime;

                    // Compute dynamic min/max for deadline picker
                    const deadlineMin = rd.submissionStart || startMin;
                    const deadlineMax = nextStart && nextStart < endTime ? nextStart : endTime;

                    return (
                      <div key={index} className={`p-3.5 rounded-lg border space-y-3 relative ${roundErrs.length > 0 ? "border-destructive/50 bg-destructive/5" : "bg-muted/20 border-border"}`}>
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
                              disabled={!hasValidEventDates}
                              min={startMin}
                              max={startMax}
                              value={rd.submissionStart || ""}
                              onChange={(e) => handleRoundChange(index, "submissionStart", e.target.value)}
                            />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-[11px] font-medium">Submission Deadline</Label>
                            <Input
                              className="text-xs h-8"
                              type="datetime-local"
                              disabled={!hasValidEventDates}
                              min={deadlineMin}
                              max={deadlineMax}
                              value={rd.submissionDeadline || ""}
                              onChange={(e) => handleRoundChange(index, "submissionDeadline", e.target.value)}
                            />
                          </div>
                        </div>

                        {roundErrs.map((err, errIdx) => (
                          <p key={errIdx} className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" /> {err}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !hasValidEventDates}>{isLoading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


