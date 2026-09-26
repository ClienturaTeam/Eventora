import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useMyRegistrations, useWithdrawRegistration } from "../hooks/participant.api";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { EventDetailsDialog } from "@/modules/events/components/EventDetailsDialog";
import { ApiEvent } from "@/modules/events/services/events.api";

export function ParticipantRegistrationsPage() {
  const { data = [], isLoading } = useMyRegistrations();
  const withdrawMutation = useWithdrawRegistration();
  const navigate = useNavigate();
  const [selectedRegRecord, setSelectedRegRecord] = useState<any | null>(null);

  const handleWithdraw = async (id: string) => {
    if (confirm("Are you sure you want to withdraw from this event?")) {
      try {
        await withdrawMutation.mutateAsync(id);
        toast.success("Successfully withdrawn");
      } catch (err: any) {
        toast.error(err.message || "Failed to withdraw");
      }
    }
  };

  const columns: Column<any>[] = [
    {
      key: "eventName",
      header: "Event",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRegRecord(row);
          }}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.event?.name}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip status={row.status.toLowerCase()} />,
    },
    {
      key: "createdAt",
      header: "Registered On",
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => {
        const isApproved =
          row.status === "APPROVED" ||
          row.status === "REGISTERED" ||
          row.status === "PAID" ||
          row.status === "CONFIRMED";

        if (isApproved) {
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                onClick={() => {
                  setSelectedRegRecord(row);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Event
              </Button>
            </div>
          );
        }

        if (row.status === "PENDING") {
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="destructive"
                size="sm" 
                onClick={() => handleWithdraw(row.id)}
                disabled={withdrawMutation.isPending}
              >
                Withdraw
              </Button>
            </div>
          );
        }

        return null;
      },
    },
  ];

  return (
    <>
      <ListPageTemplate<any>
        title="My Registrations"
        description="View your registrations."
        crumbs={[{ label: "Participant" }, { label: "Registrations" }]}
        columns={columns}
        rows={data}
        loading={isLoading}
        searchKeys={["id"]}
        selectable={false}
        onRowClick={(row) => setSelectedRegRecord(row)}
      />

      {selectedRegRecord && (
        <EventDetailsDialog
          event={selectedRegRecord.event}
          open={!!selectedRegRecord}
          onOpenChange={(open) => !open && setSelectedRegRecord(null)}
          mode="participant"
          registration={selectedRegRecord}
        />
      )}
    </>
  );
}

