import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { ApiEvent } from "@/modules/events/services/events.api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ApiEvent | null;
  transactionId?: string | null | undefined;
  registrationDetails?: {
    teamName?: string;
    leaderName?: string;
    members?: any[];
  } | null | undefined;
  onViewEvent: (event: ApiEvent) => void;
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  event,
  transactionId,
  registrationDetails,
  onViewEvent,
}: PaymentSuccessDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!event) return null;

  const isPaidEvent = event.price > 0 || (event.revenue && event.revenue > 0);
  const formattedFee = isPaidEvent ? `₹${(event.price || event.revenue || 0).toLocaleString("en-IN")}` : "Free";

  const leaderName = registrationDetails?.leaderName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Team Leader");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-center sm:text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">Registration Successful ✓</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Your event registration has been successfully confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 rounded-xl border bg-muted/20 p-4 text-xs my-2">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Event Name</span>
            <span className="font-bold text-foreground text-right">{event.name}</span>
          </div>

          {registrationDetails?.teamName && (
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Team Name</span>
              <span className="font-bold text-primary">{registrationDetails.teamName}</span>
            </div>
          )}

          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Team Leader</span>
            <span className="font-semibold text-foreground">{leaderName}</span>
          </div>

          {registrationDetails?.members && registrationDetails.members.length > 0 && (
            <div className="pb-2 border-b space-y-1">
              <span className="text-muted-foreground block">Team Members ({registrationDetails.members.length})</span>
              <div className="pl-2 space-y-0.5 text-[11px]">
                {registrationDetails.members.map((m: any, i: number) => (
                  <div key={i} className="font-medium text-foreground">
                    • {typeof m === "string" ? m : (m.name || m.email)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Registration Status</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Confirmed</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Payment Status</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {isPaidEvent ? "Paid" : "Free"}
            </span>
          </div>

          {isPaidEvent && transactionId && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-[11px] font-medium text-foreground">{transactionId}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onViewEvent(event);
            }}
            className="w-full sm:w-auto"
          >
            View Event
          </Button>

          <Button
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/participant/discover-events" });
            }}
            className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold"
          >
            My Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
