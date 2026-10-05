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
import { useCreateEvent, useUpdateEvent, ApiEvent } from "../services/events.api";
import { toast } from "sonner";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: ApiEvent | null;
}

export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDescription(event.description ?? "");
      setStartTime(event.startTime ? event.startTime.slice(0, 16) : "");
      setEndTime(event.endTime ? event.endTime.slice(0, 16) : "");
      setStatus(event.status);
      setMinTeamSize(event.minTeamSize ?? 2);
      setMaxTeamSize(event.maxTeamSize ?? 4);
    } else {
      setName(""); setDescription(""); setStartTime(""); setEndTime(""); setStatus("DRAFT"); setMinTeamSize(2); setMaxTeamSize(4);
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!startTime || !endTime) {
        toast.error("Event start time and end time are required.");
        return;
      }
      if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
        toast.error("Event end time must be after event start time.");
        return;
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
      };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: event.id, ...payload });
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
      <DialogContent className="sm:max-w-[500px]">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
