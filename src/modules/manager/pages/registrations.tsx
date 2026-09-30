import { ListPageTemplate } from "@/components/templates/list-page";
import { useManagerRegistrations, useUpdateManagerRegistrationStatus } from "../hooks/manager.api";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { EventDetailsDialog } from "@/components/events/EventDetailsDialog";
import { ApiEvent } from "@/modules/events/services/events.api";

export function ManagerRegistrationsPage() {
  const { data = [], isLoading } = useManagerRegistrations();
  const updateStatusMutation = useUpdateManagerRegistrationStatus();
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<ApiEvent | null>(null);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status } });
      toast.success(`Registration ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "user",
      header: "User",
      render: (row) => (
        <span className="font-medium">
          {row.user
            ? `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || row.user.email
            : row.userId}
        </span>
      ),
    },
    {
      key: "event",
      header: "Event",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (row.event) {
              setSelectedDetailEvent(row.event);
            }
          }}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.event?.name || "View Event"}
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
      header: "",
      render: (row) => (
        <div className="flex justify-end space-x-2">
          {row.status === "PENDING" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(row.id, "APPROVED")}>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(row.id, "REJECTED")}>
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ListPageTemplate<any>
        title="Managed Registrations"
        description="View and approve registrations you manage."
        crumbs={[{ label: "Manager" }, { label: "Registrations" }]}
        columns={columns}
        rows={data}
        loading={isLoading}
        searchKeys={["event.name", "event.title", "user.email", "user.firstName", "user.lastName", "id"]}
        statusKey="status"
        dateKey="createdAt"
        selectable={false}
        facet={{
          label: "Status",
          key: "status",
          options: ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"],
        }}
      />

      <EventDetailsDialog
        open={!!selectedDetailEvent}
        onOpenChange={(open) => !open && setSelectedDetailEvent(null)}
        event={selectedDetailEvent}
        mode="manager"
      />
    </div>
  );
}
