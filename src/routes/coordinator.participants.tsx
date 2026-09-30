import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { ListPageTemplate } from '@/components/templates/list-page';
import { StatusChip } from '@/components/ds/status-chip';
import type { Column } from '@/components/ds/data-table';

export const Route = createFileRoute('/coordinator/participants')({
  component: SCParticipantsPage,
});

function SCParticipantsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const orgId = user?.memberships?.[0]?.organization?.id;
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data;
    },
  });

  const users = (response || []).filter((m: any) => {
    return m.role?.name === 'Participant';
  }).map((m: any) => ({
    id: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    email: m.user.email,
    status: m.user.status,
    role: m.role.name,
    joined: m.user.createdAt,
  }));

  const columns: Column<typeof users[0]>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => <span className="font-medium">{row.firstName} {row.lastName}</span>,
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />,
    },
    { 
      key: 'joined', 
      header: 'Created On',
      render: (row) => <span>{new Date(row.joined).toLocaleDateString()}</span>
    },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetchApi(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      toast.success('Participant status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ListPageTemplate
        title="Participants"
        description="Manage participant account statuses."
        crumbs={[{ label: "My Coordinator Space" }, { label: "Participants" }]}
        columns={columns}
        rows={users}
        loading={isLoading}
        error={isError}
        searchKeys={["firstName", "lastName", "email"]}
        statusKey="status"
        dateKey="createdAt"
        rowActions={[
          { label: "Activate Account", onSelect: (user) => updateStatusMutation.mutate({ id: user.id, status: 'ACTIVE' }) },
          { label: "Deactivate Account", onSelect: (user) => updateStatusMutation.mutate({ id: user.id, status: 'SUSPENDED' }) },
        ]}
      />
    </div>
  );
}
