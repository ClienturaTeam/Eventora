import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiEvent } from "@/modules/events/services/events.api";
import { useUpdateManagerEvent } from "../hooks/manager.api";
import { toast } from "sonner";

interface ManagerRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: ApiEvent[];
}

export function ManagerRevenueDialog({ open, onOpenChange, events }: ManagerRevenueDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [revenue, setRevenue] = useState<number | string>(0);
  const updateMutation = useUpdateManagerEvent();

  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      const firstEvent = events[0];
      if (firstEvent) {
        setSelectedEventId(firstEvent.id);
        setRevenue(firstEvent.revenue ?? 0);
      }
    }
  }, [events, selectedEventId, open]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = events.find((e) => e.id === eventId);
    setRevenue(ev?.revenue ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }

    const parsedRevenue = Number(revenue);
    if (isNaN(parsedRevenue) || parsedRevenue < 0) {
      toast.error("Revenue must be a valid non-negative number.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedEventId,
        data: { revenue: parsedRevenue, price: parsedRevenue }
      });
      toast.success("Event revenue updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update revenue");
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Set Event Revenue</DialogTitle>
            <DialogDescription>
              Manually set or update the revenue amount for an event or hackathon.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rev-event">Select Event</Label>
              <Select value={selectedEventId} onValueChange={handleEventSelect}>
                <SelectTrigger id="rev-event">
                  <SelectValue placeholder="Choose event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name} (Current: ₹{(ev.revenue || 0).toLocaleString('en-IN')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div className="grid gap-2">
                <Label htmlFor="rev-amount">Revenue Amount (₹)</Label>
                <Input
                  id="rev-amount"
                  type="number"
                  min="0"
                  step="any"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="Enter revenue amount..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Current configured revenue: <strong className="text-foreground">₹{(selectedEvent.revenue || 0).toLocaleString('en-IN')}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !selectedEventId}>
              {updateMutation.isPending ? "Saving..." : "Save Revenue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
