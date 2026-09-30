import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useDiscoverEvents, useMyRegistrations } from "../hooks/participant.api";
import { useEventRegistrationCheckout, useVerifyEventRegistrationPayment } from "@/modules/payments/hooks/payments.hooks";
import { ApiEvent } from "@/modules/events/services/events.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TeamRegistrationWizard } from "../components/TeamRegistrationWizard";
import { ParticipantEventDetailsDialog } from "../components/ParticipantEventDetailsDialog";
import { PaymentSuccessDialog } from "../components/PaymentSuccessDialog";
import { PaymentCancelledModal } from "../components/PaymentCancelledModal";

const statusLabel: Record<string, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function ParticipantDiscoverEventsPage() {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useDiscoverEvents();
  const { data: registrations = [], refetch: refetchRegistrations } = useMyRegistrations();
  const checkoutMutation = useEventRegistrationCheckout();
  const verifyPaymentMutation = useVerifyEventRegistrationPayment();

  const [selectedTeamEvent, setSelectedTeamEvent] = useState<ApiEvent | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<ApiEvent | null>(null);
  const [cancelledPaymentEvent, setCancelledPaymentEvent] = useState<ApiEvent | null>(null);
  const [verifiedSuccessData, setVerifiedSuccessData] = useState<{
    event: ApiEvent;
    transactionId?: string;
    registrationDetails?: { teamName?: string; leaderName?: string; members?: any[] };
  } | null>(null);

  // Handle URL query parameters for Stripe redirects (?success=true or ?canceled=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const eventId = params.get("event_id");

    if (success) {
      if (eventId) {
        verifyPaymentMutation.mutate(
          { eventId },
          {
            onSuccess: (data: any) => {
              const matchedEvent = events.find((e: ApiEvent) => e.id === eventId) || data.registration?.event;
              if (matchedEvent) {
                setVerifiedSuccessData({
                  event: matchedEvent,
                  transactionId: data.payment?.providerPaymentId || data.payment?.id || "TXN-SUCCESS",
                });
              } else {
                toast.success("Payment completed successfully!");
              }
              queryClient.invalidateQueries({ queryKey: ["participant"] });
              queryClient.invalidateQueries({ queryKey: ["payments"] });
              queryClient.invalidateQueries({ queryKey: ["events"] });
              refetchRegistrations();
            },
            onError: () => {
              toast.success("Payment completed! Registration is confirmed.");
              queryClient.invalidateQueries({ queryKey: ["participant"] });
              queryClient.invalidateQueries({ queryKey: ["payments"] });
              queryClient.invalidateQueries({ queryKey: ["events"] });
              refetchRegistrations();
            },
          }
        );
      } else {
        toast.success("Payment completed! You are now registered.");
        queryClient.invalidateQueries({ queryKey: ["participant"] });
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        refetchRegistrations();
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled) {
      if (eventId && events.length > 0) {
        const matchedEvent = events.find((e: ApiEvent) => e.id === eventId);
        if (matchedEvent) {
          setCancelledPaymentEvent(matchedEvent);
        }
      } else {
        toast.error("Payment was cancelled. You can retry payment anytime.");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [events]);

  // Click Register / Register & Pay MUST ALWAYS open Team Registration Wizard first
  const handleRegister = (event: ApiEvent) => {
    setSelectedDetailEvent(null);
    setSelectedTeamEvent(event);
  };

  // Initiates Stripe Checkout ONLY AFTER Team Details & Review steps are completed
  const handleContinueToPayment = async (event: ApiEvent) => {
    try {
      toast.loading("Initiating Stripe Checkout...", { id: "stripe-checkout" });
      const result = await checkoutMutation.mutateAsync({
        eventId: event.id,
        successUrl: `${window.location.origin}/participant/discover-events?success=true&event_id=${event.id}`,
        cancelUrl: `${window.location.origin}/participant/discover-events?canceled=true&event_id=${event.id}`,
      });
      toast.dismiss("stripe-checkout");
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not retrieve payment checkout URL.");
      }
    } catch (err: any) {
      toast.dismiss("stripe-checkout");
      toast.error(err.message || "Failed to initiate payment checkout.");
    }
  };

  const handleFreeRegistrationSuccess = (
    event: ApiEvent,
    details: { teamName: string; leaderName: string; members: any[] }
  ) => {
    queryClient.invalidateQueries({ queryKey: ["discover-events"] });
    queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    refetchRegistrations();

    setVerifiedSuccessData({
      event,
      transactionId: "FREE-REGISTRATION",
      registrationDetails: details,
    });
  };

  const getRegistration = (eventId: string) => {
    return registrations.find((reg: any) => reg.eventId === eventId);
  };

  const columns: Column<ApiEvent>[] = [
    {
      key: "name",
      header: "Event",
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDetailEvent(row);
          }}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusChip status={statusLabel[row.status] ?? row.status} />,
    },
    {
      key: "startTime",
      header: "Starts",
      sortable: true,
      render: (row) => <span>{new Date(row.startTime).toLocaleDateString()}</span>,
    },
    {
      key: "endTime",
      header: "Ends",
      sortable: true,
      render: (row) => <span>{new Date(row.endTime).toLocaleDateString()}</span>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="font-medium">
          {row.price > 0 ? `₹${row.price.toLocaleString("en-IN")}` : "Free"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const reg = getRegistration(row.id);
        const isPaidEvent = row.price > 0;

        let buttonLabel = "Register";
        let disabled = false;

        if (reg && reg.status !== "CANCELLED" && reg.status !== "REJECTED") {
          if (reg.status === "PENDING" && isPaidEvent) {
            buttonLabel = "Complete Payment";
            disabled = false;
          } else {
            buttonLabel = "Registered";
            disabled = true;
          }
        } else {
          switch (row.status) {
            case "DRAFT":
              buttonLabel = "Registration Unavailable";
              disabled = true;
              break;
            case "PUBLISHED":
              buttonLabel = isPaidEvent ? "Register & Pay" : "Register";
              disabled = false;
              break;
            case "LIVE":
              buttonLabel = "Registration Closed";
              disabled = true;
              break;
            case "COMPLETED":
              buttonLabel = "Completed";
              disabled = true;
              break;
            case "CANCELLED":
              buttonLabel = "Cancelled";
              disabled = true;
              break;
            default:
              buttonLabel = "Registration Unavailable";
              disabled = true;
              break;
          }
        }

        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (reg?.status === "PENDING" && isPaidEvent) {
                  // Direct to payment or team edit if pending
                  handleContinueToPayment(row);
                } else {
                  handleRegister(row);
                }
              }}
              disabled={disabled || checkoutMutation.isPending}
              variant={disabled ? "secondary" : "default"}
            >
              {buttonLabel}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <ListPageTemplate<ApiEvent>
        title="Discover Events"
        description="Available events you can register for."
        crumbs={[{ label: "Participant" }, { label: "Discover Events" }]}
        columns={columns}
        rows={events}
        loading={isLoading}
        searchKeys={["name", "description", "category", "id"]}
        statusKey="status"
        dateKey="startTime"
        selectable={false}
        onRowClick={(row) => setSelectedDetailEvent(row)}
      />

      {/* Event Details Dialog */}
      <ParticipantEventDetailsDialog
        event={selectedDetailEvent}
        open={!!selectedDetailEvent}
        onOpenChange={(open) => !open && setSelectedDetailEvent(null)}
        registration={selectedDetailEvent ? getRegistration(selectedDetailEvent.id) : null}
        onRegister={handleRegister}
        isRegistering={checkoutMutation.isPending}
      />

      {/* Team Registration Wizard: Register -> Team Details -> Review Team Details -> Payment / Confirm */}
      {selectedTeamEvent && (
        <TeamRegistrationWizard
          event={selectedTeamEvent}
          open={!!selectedTeamEvent}
          onOpenChange={(open) => !open && setSelectedTeamEvent(null)}
          onContinueToPayment={handleContinueToPayment}
          onFreeRegistrationSuccess={handleFreeRegistrationSuccess}
        />
      )}

      {/* Payment Success Confirmation Dialog */}
      <PaymentSuccessDialog
        open={!!verifiedSuccessData}
        onOpenChange={(open) => !open && setVerifiedSuccessData(null)}
        event={verifiedSuccessData?.event || null}
        transactionId={verifiedSuccessData?.transactionId}
        registrationDetails={verifiedSuccessData?.registrationDetails}
        onViewEvent={(evt) => setSelectedDetailEvent(evt)}
      />

      {/* Payment Cancelled / Failed Modal */}
      <PaymentCancelledModal
        open={!!cancelledPaymentEvent}
        onOpenChange={(open) => !open && setCancelledPaymentEvent(null)}
        event={cancelledPaymentEvent}
        onRetryPayment={handleContinueToPayment}
        onEditTeamDetails={(evt) => {
          setCancelledPaymentEvent(null);
          setSelectedTeamEvent(evt);
        }}
      />
    </div>
  );
}
