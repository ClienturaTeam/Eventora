import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ListPageTemplate } from '@/components/templates/list-page';
import { StatusChip } from '@/components/ds/status-chip';
import type { Column } from '@/components/ds/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/faculty-coordinator/student-coordinators')({
  component: FCStudentCoordinatorsPage,
});

function FCStudentCoordinatorsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Student Coordinator',
  });

  const permissions = user?.memberships?.[0]?.role?.permissions?.map((p: any) => p.permission.action) || [];
  const canCreateStudent = permissions.includes('users.create_student_coordinator');

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['student-coordinators'],
    queryFn: async () => {
      const orgId = user?.memberships?.[0]?.organization?.id;
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetchApi('/users/privileged', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-coordinators'] });
      toast.success('Student Coordinator created successfully');
      setIsDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'Student Coordinator' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create Student Coordinator');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const users = (response || []).filter((m: any) => {
    return m.role?.name === 'Student Coordinator';
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
      queryClient.invalidateQueries({ queryKey: ['student-coordinators'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Coordinators</h1>
        
        {canCreateStudent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Add Student Coordinator</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Student Coordinator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      required 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Coordinator Account'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ListPageTemplate
        title=""
        description="Manage student coordinators and their event assignments."
        crumbs={[{ label: "Faculty Space" }, { label: "Student Coordinators" }]}
        columns={columns}
        rows={users}
        loading={isLoading}
        error={isError}
        searchKeys={["firstName", "lastName", "email"]}
        rowActions={[
          { label: "Activate", onSelect: (user) => updateStatusMutation.mutate({ id: user.id, status: 'ACTIVE' }) },
          { label: "Deactivate", onSelect: (user) => updateStatusMutation.mutate({ id: user.id, status: 'SUSPENDED' }) },
        ]}
      />
    </>
  );
}
