import { ListPageTemplate } from "@/components/templates/list-page";
import { useMyRegistrations, useWithdrawRegistration } from "../hooks/participant.api";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ParticipantRegistrationsPage() {
  const { data = [], isLoading } = useMyRegistrations();
  const withdrawMutation = useWithdrawRegistration();

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
      render: (row) => <span className="font-medium">{row.event?.name}</span>,
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
      render: (row) => {
        const isPaidOrApproved = row.status === "APPROVED" || row.status === "REGISTERED" || row.status === "PAID";
        if (isPaidOrApproved) {
          return null;
        }

        return (
          <div className="flex justify-end">
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
      },
    },
  ];

  return (
    <ListPageTemplate<any>
      title="My Registrations"
      description="View your registrations."
      crumbs={[{ label: "Participant" }, { label: "Registrations" }]}
      columns={columns}
      rows={data}
      loading={isLoading}
      searchKeys={["id"]}
    />
  );
}
