import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useDiscoverEvents, useRegisterForEvent, useMyRegistrations } from "../hooks/participant.api";
import { useEventRegistrationCheckout } from "@/modules/payments/hooks/payments.hooks";
import { ApiEvent } from "@/modules/events/services/events.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { TeamRegistrationWizard } from "../components/TeamRegistrationWizard";
import { ProblemStatementSelector } from "../components/ProblemStatementSelector";

const statusLabel: Record<string, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  LIVE: "active",
  COMPLETED: "closed",
  CANCELLED: "cancelled",
};

export function ParticipantDiscoverEventsPage() {
  const { data: events = [], isLoading } = useDiscoverEvents();
  const { data: registrations = [] } = useMyRegistrations();
  const registerMutation = useRegisterForEvent();
  const checkoutMutation = useEventRegistrationCheckout();
  
  const [selectedTeamEvent, setSelectedTeamEvent] = useState<ApiEvent | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      toast.success("Payment successful! You are registered for the event.");
      // Optional: clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("canceled")) {
      toast.error("Payment was canceled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleRegister = async (event: ApiEvent) => {
    try {
      if (event.registrationType === "TEAM") {
        setSelectedTeamEvent(event);
        return;
      }
      
      if (event.price > 0) {
        await checkoutMutation.mutateAsync({
          eventId: event.id,
          successUrl: `${window.location.origin}/participant/discover-events?success=true`,
          cancelUrl: `${window.location.origin}/participant/discover-events?canceled=true`,
        });
        // The mutation will redirect to Stripe Checkout
      } else {
        await registerMutation.mutateAsync({ eventId: event.id });
        toast.success("Successfully registered for event");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    }
  };

  const getRegistration = (eventId: string) => {
    return registrations.find((reg: any) => reg.eventId === eventId);
  };

  const columns: Column<ApiEvent>[] = [
    {
      key: "name",
      header: "Event",
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
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
      render: (row) => <span>{row.price > 0 ? `$${row.price.toFixed(2)}` : "Free"}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const reg = getRegistration(row.id);
        const isPaidEvent = row.price > 0;
        
        let buttonLabel = "Register";
        let disabled = false;
        
        if (reg) {
          if (reg.status === "CANCELLED" || reg.status === "REJECTED") {
            buttonLabel = isPaidEvent ? "Register & Pay" : "Register";
          } else if (reg.status === "PENDING" && isPaidEvent) {
            buttonLabel = "Complete Payment";
          } else {
            buttonLabel = "Registered";
            disabled = true;
          }
        } else {
          buttonLabel = isPaidEvent ? "Register & Pay" : "Register";
        }

        return (
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={() => handleRegister(row)}
              disabled={disabled || registerMutation.isPending || checkoutMutation.isPending}
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
      <ProblemStatementSelector />

      <div className="border-t pt-6">
        <ListPageTemplate<ApiEvent>
          title="Discover Events"
          description="Available events you can register for."
          crumbs={[{ label: "Participant" }, { label: "Discover Events" }]}
          columns={columns}
          rows={events}
          loading={isLoading}
          searchKeys={["name"]}
        />
      </div>
      
      {selectedTeamEvent && (
        <TeamRegistrationWizard 
          event={selectedTeamEvent} 
          open={!!selectedTeamEvent} 
          onOpenChange={(open) => !open && setSelectedTeamEvent(null)}
          onSuccess={() => setSelectedTeamEvent(null)}
        />
      )}
    </div>
  );
}
