import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { useState } from 'react';
import { ListPageTemplate } from '@/components/templates/list-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, CheckCircle, Lock, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/manager/problem-statements')({
  component: ManagerProblemStatementsComponent,
});

function ManagerProblemStatementsComponent() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['problem-statements', 'manager'],
    queryFn: async () => {
      const res = await fetchApi('/problem-statements');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; title: string; category: string; description: string }) => {
      return fetchApi('/problem-statements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-statements'] });
      toast.success('Problem Statement created successfully!');
      setIsCreateOpen(false);
      setCode('');
      setTitle('');
      setCategory('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create problem statement');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchApi(`/problem-statements/${id}/release`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-statements'] });
      toast.success('Problem Statement released to students!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to release problem statement');
    },
  });

  const handleCreate = () => {
    if (!code.trim() || !title.trim() || !description.trim()) {
      toast.error('Code, title, and description are required.');
      return;
    }
    createMutation.mutate({ code: code.trim(), title: title.trim(), category: category.trim(), description: description.trim() });
  };

  const statements = response || [];

  return (
    <>
      <ListPageTemplate<any>
        title="Problem Statements Management"
        description="Create, assign, publish, and manage problem statements for hackathon tracks."
        crumbs={[{ label: 'Manager' }, { label: 'Problem Statements' }]}
        headerActions={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" />
            Create Problem Statement
          </Button>
        }
        columns={[
          { key: 'code', header: 'Code', render: (row) => <span className="font-mono font-bold text-primary">{row.code}</span> },
          { key: 'title', header: 'Title', render: (row) => <span className="font-semibold text-foreground">{row.title}</span> },
          { key: 'category', header: 'Category', render: (row) => <Badge variant="outline">{row.category || 'General'}</Badge> },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant={row.isReleased ? 'default' : 'secondary'} className={row.isReleased ? 'bg-emerald-600' : ''}>
                {row.isReleased ? 'RELEASED' : 'DRAFT'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex items-center gap-2">
                {!row.isReleased && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => releaseMutation.mutate(row.id)}
                    disabled={releaseMutation.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Publish / Release
                  </Button>
                )}
                {row.isReleased && (
                  <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                    <Lock className="h-3 w-3" /> Published
                  </Badge>
                )}
              </div>
            ),
          },
        ]}
        rows={statements.length > 0 ? statements : [
          {
            id: 'ps-01',
            code: 'PS-AI-01',
            title: 'AI-Powered Healthcare Triage Assistant',
            category: 'Artificial Intelligence',
            isReleased: true,
            description: 'Develop an intuitive triage system.',
          },
        ]}
        loading={isLoading}
        searchKeys={['code', 'title', 'category']}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create New Problem Statement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the problem statement code, track category, and detailed problem statement requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="psCode">Problem Statement Code *</Label>
              <Input
                id="psCode"
                placeholder="e.g. PS-AI-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="psTitle">Title *</Label>
              <Input
                id="psTitle"
                placeholder="e.g. AI-Powered Healthcare Triage Assistant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="psCategory">Category / Track</Label>
              <Input
                id="psCategory"
                placeholder="e.g. Artificial Intelligence, FinTech, EdTech"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="psDesc">Description & Specifications *</Label>
              <Textarea
                id="psDesc"
                rows={4}
                placeholder="Detailed explanation of the problem, required deliverables, evaluation criteria, and constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Problem Statement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
