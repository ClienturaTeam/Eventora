import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Edit3, ArrowLeft } from "lucide-react";
import { ApiEvent } from "@/modules/events/services/events.api";

interface PaymentCancelledModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ApiEvent | null;
  onRetryPayment: (event: ApiEvent) => void;
  onEditTeamDetails: (event: ApiEvent) => void;
}

export function PaymentCancelledModal({
  open,
  onOpenChange,
  event,
  onRetryPayment,
  onEditTeamDetails,
}: PaymentCancelledModalProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader className="text-center sm:text-center pb-2 border-b">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-center text-amber-600 dark:text-amber-400">
            Payment Cancelled / Payment Failed
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-1">
            Your team registration details are saved as pending. Payment was not completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 text-xs">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Event</span>
              <span className="font-semibold text-foreground">{event.name}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-muted-foreground font-medium">Registration Status</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Pending Payment</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 border-t pt-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              onRetryPayment(event);
            }}
            className="w-full text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Payment
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEditTeamDetails(event);
            }}
            className="w-full text-xs"
          >
            <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Team Details
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Discover Events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
