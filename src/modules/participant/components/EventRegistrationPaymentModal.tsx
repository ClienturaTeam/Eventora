import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, IndianRupee, ShieldCheck, Loader2 } from "lucide-react";
import { ApiEvent } from "@/modules/events/services/events.api";
import { useAuth } from "@/lib/auth";

interface EventRegistrationPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ApiEvent | null;
  registration?: any;
  onPayNow: () => void;
  isProcessing: boolean;
}

export function EventRegistrationPaymentModal({
  open,
  onOpenChange,
  event,
  registration,
  onPayNow,
  isProcessing,
}: EventRegistrationPaymentModalProps) {
  const { user } = useAuth();
  if (!event) return null;

  const participantName = registration?.team?.name
    ? `Team: ${registration.team.name}`
    : (user as any)?.name || user?.email || "Participant";

  const feeAmount = (event.price && event.price > 0) ? event.price : (event.revenue || 0);
  const formattedFee = `₹${feeAmount.toLocaleString("en-IN")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-center sm:text-center pb-2 border-b">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            EVENT REGISTRATION
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Review event details and complete payment to confirm registration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-xl border bg-card/60 p-4 space-y-3 text-sm shadow-sm">
            <div className="flex justify-between items-start gap-4 pb-2 border-b">
              <span className="text-xs text-muted-foreground font-medium">Event</span>
              <span className="font-semibold text-right text-foreground">{event.name}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-xs text-muted-foreground font-medium">Registration Fee</span>
              <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                {formattedFee}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-xs text-muted-foreground font-medium">Participant / Team</span>
              <span className="font-medium text-foreground">{participantName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Payment Status</span>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold">
                Pending
              </Badge>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 border text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Secure 256-bit encrypted Stripe payment processing.</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 border-t pt-4">
          <Button
            onClick={onPayNow}
            disabled={isProcessing}
            className="w-full text-sm font-semibold py-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full text-xs text-muted-foreground"
          >
            Cancel & Back to Events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
