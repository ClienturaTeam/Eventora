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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, CheckCircle, Lock, Edit3, Layers, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useEventRounds } from '@/modules/events/services/events.api';

export const Route = createFileRoute('/manager/problem-statements')({
  component: ManagerProblemStatementsComponent,
});

function ManagerProblemStatementsComponent() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStatement, setEditingStatement] = useState<any>(null);

  const [eventId, setEventId] = useState<string>('');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoundIds, setSelectedRoundIds] = useState<string[]>([]);

  // Fetch events list
  const { data: events = [] } = useEvents();

  // Fetch rounds for selected event
  const { data: eventRounds = [] } = useEventRounds(eventId);

  const { data: response, isLoading } = useQuery({
    queryKey: ['problem-statements', 'manager'],
    queryFn: async () => {
      const res = await fetchApi('/problem-statements');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { eventId?: string; code: string; title: string; category: string; description: string; applicableRoundIds?: string[] }) => {
      return fetchApi('/problem-statements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-statements'] });
      toast.success('Problem Statement created successfully!');
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create problem statement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchApi(`/problem-statements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-statements'] });
      toast.success('Problem Statement updated successfully!');
      resetForm();
      setEditingStatement(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update problem statement');
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

  const resetForm = () => {
    setEventId('');
    setCode('');
    setTitle('');
    setCategory('');
    setDescription('');
    setSelectedRoundIds([]);
  };

  const handleCreate = () => {
    if (!code.trim() || !title.trim() || !description.trim()) {
      toast.error('Code, title, and description are required.');
      return;
    }
    const payload: any = {
      code: code.trim(),
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      applicableRoundIds: selectedRoundIds,
    };
    if (eventId) {
      payload.eventId = eventId;
    }
    createMutation.mutate(payload);
  };

  const handleUpdate = () => {
    if (!editingStatement) return;
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    updateMutation.mutate({
      id: editingStatement.id,
      data: {
        eventId: eventId || null,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        applicableRoundIds: selectedRoundIds,
      },
    });
  };

  const openEdit = (statement: any) => {
    setEditingStatement(statement);
    setEventId(statement.eventId || statement.event?.id || '');
    setCode(statement.code || '');
    setTitle(statement.title || '');
    setCategory(statement.category || '');
    setDescription(statement.description || '');
    setSelectedRoundIds(statement.applicableRounds ? statement.applicableRounds.map((r: any) => r.id) : []);
  };

  const toggleRoundSelection = (roundId: string) => {
    setSelectedRoundIds((prev) =>
      prev.includes(roundId) ? prev.filter((id) => id !== roundId) : [...prev, roundId]
    );
  };

  const statements = response || [];

  return (
    <>
      <ListPageTemplate<any>
        title="Problem Statements Management"
        description="Create, configure applicable rounds, publish, and manage problem statements for events."
        crumbs={[{ label: 'Manager' }, { label: 'Problem Statements' }]}
        headerActions={
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="gap-1.5 bg-primary"
          >
            <Plus className="h-4 w-4" />
            Create Problem Statement
          </Button>
        }
        columns={[
          {
            key: 'code',
            header: 'Code & Event',
            render: (row) => (
              <div>
                <span className="font-mono font-bold text-primary block">{row.code}</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-amber-500" />
                  {row.event?.name || 'All Events'}
                </span>
              </div>
            ),
          },
          {
            key: 'title',
            header: 'Title & Description',
            render: (row) => (
              <div>
                <span className="font-semibold text-foreground text-sm block">{row.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>
              </div>
            ),
          },
          {
            key: 'applicableRounds',
            header: 'Applicable Rounds',
            render: (row) => {
              const rounds = row.applicableRounds || [];
              if (rounds.length === 0) {
                return <span className="text-xs text-muted-foreground italic">All Rounds (Default)</span>;
              }
              return (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {rounds.map((r: any) => (
                    <Badge key={r.id} variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/5 text-blue-600 border-blue-500/20">
                      R{r.roundNumber}: {r.name}
                    </Badge>
                  ))}
                </div>
              );
            },
          },
          {
            key: 'category',
            header: 'Category',
            render: (row) => <Badge variant="outline" className="text-xs">{row.category || 'General'}</Badge>,
          },
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(row)}
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </Button>
                {!row.isReleased && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
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
        rows={statements}
        loading={isLoading}
        searchKeys={['code', 'title', 'category']}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create New Problem Statement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define problem code, select event, track category, and configure applicable event rounds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="psEvent">Associated Event</Label>
              <Select value={eventId} onValueChange={(val) => { setEventId(val); setSelectedRoundIds([]); }}>
                <SelectTrigger id="psEvent" className="text-xs">
                  <SelectValue placeholder="Select Event (Optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="psCode">Problem Statement Code *</Label>
              <Input
                id="psCode"
                placeholder="e.g. PS-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="psTitle">Title *</Label>
              <Input
                id="psTitle"
                placeholder="e.g. AI-Powered Smart City Grid Optimization"
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

            {/* Applicable Rounds Configuration */}
            {eventId ? (
              <div className="space-y-2 p-3 bg-muted/30 border rounded-lg">
                <Label className="text-xs font-semibold flex items-center gap-1 text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Applicable Event Rounds ({selectedRoundIds.length} selected)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Select which event rounds apply to participants choosing this problem statement.
                </p>

                {eventRounds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No rounds configured for this event yet.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {eventRounds.map((round) => {
                      const checked = selectedRoundIds.includes(round.id);
                      return (
                        <div key={round.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50">
                          <Checkbox
                            id={`create-round-${round.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleRoundSelection(round.id)}
                          />
                          <label
                            htmlFor={`create-round-${round.id}`}
                            className="text-xs font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <Badge variant="outline" className="text-[10px]">Round {round.roundNumber}</Badge>
                            <span>{round.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({round.maxMarks} marks)</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-dashed rounded-lg text-[11px] text-muted-foreground text-center">
                Select an Event above to configure applicable rounds.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="psDesc">Description & Specifications *</Label>
              <Textarea
                id="psDesc"
                rows={4}
                placeholder="Detailed explanation of the problem statement requirements..."
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

      {/* Edit Dialog */}
      <Dialog open={!!editingStatement} onOpenChange={(open) => !open && setEditingStatement(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Problem Statement ({editingStatement?.code})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update title, category, description, and applicable rounds for this problem statement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="editPsEvent">Associated Event</Label>
              <Select value={eventId} onValueChange={(val) => { setEventId(val); setSelectedRoundIds([]); }}>
                <SelectTrigger id="editPsEvent" className="text-xs">
                  <SelectValue placeholder="Select Event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPsTitle">Title *</Label>
              <Input
                id="editPsTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPsCategory">Category / Track</Label>
              <Input
                id="editPsCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Applicable Rounds Configuration */}
            {eventId ? (
              <div className="space-y-2 p-3 bg-muted/30 border rounded-lg">
                <Label className="text-xs font-semibold flex items-center gap-1 text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Applicable Event Rounds ({selectedRoundIds.length} selected)
                </Label>

                {eventRounds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No rounds configured for this event yet.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {eventRounds.map((round) => {
                      const checked = selectedRoundIds.includes(round.id);
                      return (
                        <div key={round.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50">
                          <Checkbox
                            id={`edit-round-${round.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleRoundSelection(round.id)}
                          />
                          <label
                            htmlFor={`edit-round-${round.id}`}
                            className="text-xs font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <Badge variant="outline" className="text-[10px]">Round {round.roundNumber}</Badge>
                            <span>{round.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({round.maxMarks} marks)</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-dashed rounded-lg text-[11px] text-muted-foreground text-center">
                Select an Event above to configure applicable rounds.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="editPsDesc">Description & Specifications *</Label>
              <Textarea
                id="editPsDesc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingStatement(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
