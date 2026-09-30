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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/platform-admin/privileged-accounts')({
  component: PrivilegedAccountsPage,
});

function PrivilegedAccountsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Participant',
  });

  const permissions = user?.memberships?.[0]?.role?.permissions?.map((p: any) => p.permission.action) || [];
  const canCreateManager = permissions.includes('users.create_manager');
  const canCreateFaculty = permissions.includes('users.create_faculty_coordinator');
  const canCreatePrincipal = permissions.includes('users.create_principal');
  const canCreateStudent = permissions.includes('users.create_student_coordinator');
  const canCreateParticipant = permissions.includes('users.create_participant');
  
  const canCreateAny = canCreateManager || canCreateFaculty || canCreatePrincipal || canCreateStudent || canCreateParticipant;

  const { data: response, isLoading } = useQuery({
    queryKey: ['privileged-users'],
    queryFn: async () => {
      // Use existing users endpoint. 
      const res = await fetchApi('/users');
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
      queryClient.invalidateQueries({ queryKey: ['privileged-users'] });
      toast.success('Account created successfully');
      setIsDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'Participant' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create account');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Filter users based on search and role filter
  const users = (response || []).filter((u: any) => {
    const roleName = (u.memberships?.[0]?.role?.name || 'Participant').trim();
    const email = (u.email || '').toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();

    let matchesRole = roleFilter === 'All';
    if (roleFilter === 'Manager') {
      matchesRole = roleName === 'Manager' || roleName === 'Admin' || roleName === 'Organization Admin' || roleName === 'Sudo Admin' || roleName === 'Platform Admin' || email.includes('manager') || email.includes('admin');
    } else if (roleFilter === 'Principal') {
      matchesRole = roleName === 'Principal' || name.includes('principal') || email.includes('principal');
    } else if (roleFilter === 'Student Coordinator') {
      matchesRole = roleName === 'Student Coordinator' || roleName.includes('Coordinator') || email.includes('coordinator');
    } else if (roleFilter === 'Faculty Coordinator') {
      matchesRole = roleName === 'Faculty Coordinator' || name.includes('faculty') || email.includes('faculty');
    } else if (roleFilter === 'Participant') {
      matchesRole = roleName === 'Participant' || email.includes('participant') || name.includes('participant');
    } else if (roleFilter !== 'All') {
      matchesRole = roleName.toLowerCase() === roleFilter.toLowerCase();
    }

    const matchesSearch = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${roleName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filterTabs = [
    { label: 'All', value: 'All' },
    { label: 'Managers', value: 'Manager' },
    { label: 'Principals', value: 'Principal' },
    { label: 'Student Coordinators', value: 'Student Coordinator' },
    { label: 'Faculty Coordinators', value: 'Faculty Coordinator' },
    { label: 'Participants', value: 'Participant' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        
        {canCreateAny && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User Account</DialogTitle>
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
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({...formData, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {canCreateManager && <SelectItem value="Manager">Manager</SelectItem>}
                      {canCreatePrincipal && <SelectItem value="Principal">Principal</SelectItem>}
                      {canCreateStudent && <SelectItem value="Student Coordinator">Student Coordinator</SelectItem>}
                      {canCreateFaculty && <SelectItem value="Faculty Coordinator">Faculty Coordinator</SelectItem>}
                      {canCreateParticipant && <SelectItem value="Participant">Participant</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <Input 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex bg-muted p-1 rounded-md">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${
                roleFilter === tab.value
                  ? 'bg-background shadow-sm font-medium text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {u.memberships?.[0]?.role?.name || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3">{u.status}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No privileged accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
