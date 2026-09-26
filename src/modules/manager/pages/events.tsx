import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useManagerEvents, useDeleteManagerEvent } from "../hooks/manager.api";
import { ApiEvent } from "@/modules/events/services/events.api";
import { ManagerEventDialog } from "../components/manager-event-dialog";
import { ManagerRevenueDialog } from "../components/manager-revenue-dialog";
import { EventDetailsDialog } from "@/modules/events/components/EventDetailsDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Plus, DollarSign, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const statusLabel: Record<string, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function ManagerEventsPage() {
  const { data: events = [], isLoading } = useManagerEvents();
  const deleteMutation = useDeleteManagerEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<ApiEvent | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Event deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    }
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
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          ₹{(row.revenue || 0).toLocaleString('en-IN')}
        </span>
      ),
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
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" asChild title="View Financial Overview">
            <Link to={`/manager/events/${row.id}/revenue` as any}>
              <IndianRupee className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(row); setDialogOpen(true); }}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end gap-3 mb-4">
        <Button variant="outline" onClick={() => setRevenueDialogOpen(true)}>
          <IndianRupee className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
          Revenue
        </Button>
        <Button onClick={() => { setEditingEvent(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
      <ListPageTemplate<ApiEvent>
        title="Managed Events"
        description="Events you have management access to."
        crumbs={[{ label: "Manager" }, { label: "Events" }]}
        columns={columns}
        rows={events}
        loading={isLoading}
        searchKeys={["name"]}
        selectable={false}
        onRowClick={(row) => setSelectedDetailEvent(row)}
        facet={{
          label: "Status",
          key: "status",
          options: ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED", "CANCELLED"],
        }}
      />
      <ManagerEventDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        event={editingEvent} 
      />
      <ManagerRevenueDialog
        open={revenueDialogOpen}
        onOpenChange={setRevenueDialogOpen}
        events={events}
      />
      <EventDetailsDialog
        event={selectedDetailEvent}
        open={!!selectedDetailEvent}
        onOpenChange={(open) => !open && setSelectedDetailEvent(null)}
        mode="manager"
      />
    </>
  );
}
