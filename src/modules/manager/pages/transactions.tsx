import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useManagerTransactions, useRefundEventPayment } from "@/modules/payments/hooks/payments.hooks";
import { Button } from "@/components/ui/button";
import { EventDetailsDialog } from "@/components/events/EventDetailsDialog";
import { ApiEvent } from "@/modules/events/services/events.api";
import { toast } from "sonner";

export function ManagerTransactionsPage() {
  const { data: transactions = [], isLoading } = useManagerTransactions();
  const refundMutation = useRefundEventPayment();
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<ApiEvent | null>(null);

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to refund this payment?")) return;

    try {
      await refundMutation.mutateAsync({ paymentId, reason: "requested_by_customer" });
      toast.success("Refund initiated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to refund payment");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "user",
      header: "Participant",
      render: (row) => (
        <div>
          <div className="font-medium">{row.user?.firstName} {row.user?.lastName}</div>
          <div className="text-xs text-muted-foreground">{row.user?.email}</div>
        </div>
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
            if (row.event) setSelectedDetailEvent(row.event);
          }}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.event?.name || "-"}
        </button>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span>
          ₹{row.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip status={row.status.toLowerCase()} />,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end">
          {row.status === "SUCCEEDED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRefund(row.id)}
              disabled={refundMutation.isPending}
            >
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ListPageTemplate<any>
        title="Event Transactions"
        description="View and manage participant payments for events."
        crumbs={[{ label: "Manager" }, { label: "Transactions" }]}
        columns={columns}
        rows={transactions}
        loading={isLoading}
        selectable={false}
        searchKeys={["user.email", "user.firstName", "user.lastName", "event.name"]}
      />

      <EventDetailsDialog
        open={!!selectedDetailEvent}
        onOpenChange={(open) => !open && setSelectedDetailEvent(null)}
        event={selectedDetailEvent}
        mode="manager"
      />
    </>
  );
}
