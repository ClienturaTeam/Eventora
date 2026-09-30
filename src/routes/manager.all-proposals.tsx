import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { ListPageTemplate } from '@/components/templates/list-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Eye, Sparkles, AlertCircle, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/manager/all-proposals')({
  component: AllProposalsComponent,
});

export function statusBadge(status: string, hasEvent: boolean = false) {
  const pStatus = (status || '').toUpperCase();
  if (hasEvent || pStatus === 'EVENT_CREATED') {
    return <Badge className="bg-purple-600 text-white font-semibold flex items-center gap-1"><CalendarDays className="h-3 w-3" /> EVENT_CREATED</Badge>;
  }
  switch (pStatus) {
    case 'PRINCIPAL_APPROVED':
    case 'MANAGER_APPROVED':
    case 'APPROVED':
      return <Badge className="bg-emerald-600 text-white font-semibold">APPROVED</Badge>;
    case 'MANAGER_REJECTED':
    case 'PRINCIPAL_REJECTED':
    case 'REJECTED':
      return <Badge variant="destructive" className="font-semibold">REJECTED</Badge>;
    case 'SUBMITTED_TO_MANAGER':
    case 'SUBMITTED_TO_PRINCIPAL':
    case 'UNDER_REVIEW':
    case 'PENDING':
    case 'SUBMITTED':
    case 'DRAFT':
      return <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10 font-semibold">PENDING</Badge>;
    case 'CHANGES_REQUESTED':
      return <Badge variant="outline" className="border-blue-500/50 text-blue-600 bg-blue-500/10 font-semibold">CHANGES REQ</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function AllProposalsComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as any;

  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams?.status ? searchParams.status.toUpperCase() : 'ALL'
  );

  useEffect(() => {
    if (searchParams?.status) {
      setStatusFilter(searchParams.status.toUpperCase());
    }
  }, [searchParams?.status]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['all-proposals'],
    queryFn: async () => {
      const res = await fetchApi('/hackathon-proposals');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: string; comment?: string }) => {
      const body: any = { action };
      if (comment) body.comment = comment;
      return fetchApi(`/hackathon-proposals/${id}/manager-review`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['manager-proposals'] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async ({ proposalId, eventName }: { proposalId: string; eventName: string }) => {
      return fetchApi(`/hackathon-proposals/${proposalId}/create-event`, {
        method: 'POST',
        body: JSON.stringify({
          name: eventName,
          type: 'HACKATHON',
          status: 'PUBLISHED',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleApproveProposal = async (proposal: any) => {
    try {
      await reviewMutation.mutateAsync({ id: proposal.id, action: 'APPROVE' });
      toast.success(`Proposal "${proposal.title}" approved! Status updated to APPROVED.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve proposal');
    }
  };

  const handleCreateEvent = async (proposal: any) => {
    try {
      await createEventMutation.mutateAsync({ proposalId: proposal.id, eventName: proposal.title });
      toast.success(`Event created successfully for "${proposal.title}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event from proposal');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }
    try {
      await reviewMutation.mutateAsync({ id: rejectTarget.id, action: 'REJECT', comment: rejectionReason.trim() });
      toast.success(`Proposal "${rejectTarget.title}" rejected with reason recorded.`);
      setRejectTarget(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject proposal');
    }
  };

  const proposals = response || [];

  const filteredProposals = proposals.filter((p: any) => {
    const pStatus = (p.status || '').toUpperCase();
    const hasEvent = !!p.event || pStatus === 'EVENT_CREATED';

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return !hasEvent && pStatus !== 'PRINCIPAL_APPROVED' && pStatus !== 'MANAGER_APPROVED' && pStatus !== 'APPROVED' && pStatus !== 'MANAGER_REJECTED' && pStatus !== 'PRINCIPAL_REJECTED' && pStatus !== 'REJECTED';
    if (statusFilter === 'APPROVED') return (pStatus === 'PRINCIPAL_APPROVED' || pStatus === 'MANAGER_APPROVED' || pStatus === 'APPROVED') && !hasEvent;
    if (statusFilter === 'EVENT_CREATED') return hasEvent;
    if (statusFilter === 'REJECTED') return pStatus === 'MANAGER_REJECTED' || pStatus === 'PRINCIPAL_REJECTED' || pStatus === 'REJECTED';
    return true;
  });

  return (
    <>
      <ListPageTemplate<any>
        title="All Event Proposals"
        description="Central proposal management module. Review, approve, reject student proposals, and create linked events."
        crumbs={[{ label: 'Manager' }, { label: 'All Proposals' }]}
        headerActions={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px] h-9 text-xs">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="EVENT_CREATED">Event Created</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        columns={[
          { key: 'title', header: 'EVENT PROPOSAL NAME', render: (row) => <span className="font-semibold text-foreground">{row.title}</span> },
          { key: 'organizer', header: 'ORGANIZER / STUDENT', render: (row) => <span className="text-muted-foreground text-xs">{row.submittedBy ? `${row.submittedBy.firstName || ''} ${row.submittedBy.lastName || ''}`.trim() || row.submittedBy.email : 'Student Lead'}</span> },
          { key: 'participants', header: 'EST. PARTICIPANTS', render: (row) => <span className="font-mono text-xs">{row.expectedParticipants || 100}</span> },
          { key: 'date', header: 'SUBMITTED DATE', render: (row) => <span className="text-muted-foreground text-xs">{new Date(row.createdAt).toLocaleDateString()}</span> },
          { key: 'status', header: 'STATUS', render: (row) => statusBadge(row.status, !!row.event) },
          {
            key: 'actions',
            header: 'ACTIONS',
            render: (row) => {
              const pStatus = (row.status || '').toUpperCase();
              const hasEvent = !!row.event || pStatus === 'EVENT_CREATED';
              const isApproved = (pStatus === 'PRINCIPAL_APPROVED' || pStatus === 'MANAGER_APPROVED' || pStatus === 'APPROVED') && !hasEvent;
              const isRejected = pStatus === 'MANAGER_REJECTED' || pStatus === 'PRINCIPAL_REJECTED' || pStatus === 'REJECTED';
              const isPending = !isApproved && !hasEvent && !isRejected;

              return (
                <div className="flex items-center gap-2">
                  {/* 1. PENDING status -> Action Dropdown with Approve / Reject */}
                  {isPending && (
                    <Select
                      value=""
                      onValueChange={(val) => {
                        if (val === 'approve') {
                          handleApproveProposal(row);
                        } else if (val === 'reject') {
                          setRejectTarget(row);
                          setRejectionReason('');
                        }
                      }}
                      disabled={reviewMutation.isPending}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 font-medium">
                        <SelectValue placeholder="Select Action" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="approve" className="text-xs text-emerald-600 font-medium cursor-pointer">
                          Approve
                        </SelectItem>
                        <SelectItem value="reject" className="text-xs text-destructive font-medium cursor-pointer">
                          Reject
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* 2. APPROVED status -> Create Event button */}
                  {isApproved && (
                    <Button
                      size="sm"
                      className="gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      onClick={() => handleCreateEvent(row)}
                      disabled={createEventMutation.isPending}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {createEventMutation.isPending ? 'Creating Event...' : 'Create Event'}
                    </Button>
                  )}

                  {/* 3. Universal View Details button for every proposal */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => setSelectedProposal(row)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                </div>
              );
            },
          },
        ]}
        rows={filteredProposals}
        loading={isLoading}
        searchKeys={['title', 'submittedBy.firstName', 'submittedBy.email']}
      />

      {/* Detail Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        {selectedProposal && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-bold">{selectedProposal.title}</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Comprehensive overview of submitted event proposal specifications, budget, and approval logs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/30">
                <div>
                  <span className="text-muted-foreground">Organizer:</span>
                  <p className="font-semibold text-foreground">
                    {selectedProposal.submittedBy ? `${selectedProposal.submittedBy.firstName || ''} ${selectedProposal.submittedBy.lastName || ''}`.trim() : 'Student Lead'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{selectedProposal.submittedBy?.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Status:</span>
                  <div className="mt-1">{statusBadge(selectedProposal.status, !!selectedProposal.event)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Participants:</span>
                  <p className="font-semibold text-foreground">{selectedProposal.expectedParticipants || 100} Students</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Budget:</span>
                  <p className="font-semibold text-foreground">₹{selectedProposal.estimatedBudget?.toLocaleString('en-IN') || '25,000'}</p>
                </div>
                {selectedProposal.managerReviewedAt && (
                  <div>
                    <span className="text-muted-foreground">Reviewed Date:</span>
                    <p className="font-semibold text-foreground">{new Date(selectedProposal.managerReviewedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedProposal.event && (
                  <div>
                    <span className="text-muted-foreground">Linked Event:</span>
                    <p className="font-semibold text-purple-600">{selectedProposal.event.name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Description & Objectives</Label>
                <p className="p-3 rounded-md border bg-card text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedProposal.description || 'No description provided.'}
                </p>
              </div>

              {selectedProposal.requirements && (
                <div className="space-y-1.5">
                  <Label className="font-semibold text-foreground">Rules & Technical Requirements</Label>
                  <p className="p-3 rounded-md border bg-card text-foreground leading-relaxed">
                    {selectedProposal.requirements}
                  </p>
                </div>
              )}

              {(selectedProposal.managerComment || selectedProposal.principalComment) && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400">Review Feedback / Rejection Reason:</span>
                  <p className="text-foreground">{selectedProposal.managerComment || selectedProposal.principalComment}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedProposal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Mandatory Rejection Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        {rejectTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Reject Event Proposal</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Mandatory Requirement: Provide a clear, constructive reason for rejecting "{rejectTarget.title}". This reason will be stored in the audit trail and displayed to the student organizer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 my-2">
              <Label htmlFor="rejReason" className="text-xs font-semibold text-foreground">Reason for Rejection *</Label>
              <Textarea
                id="rejReason"
                rows={4}
                placeholder="Explain why this proposal is rejected (e.g., budget constraints, venue unavailability, or conflicting schedule)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={handleConfirmReject}
                disabled={reviewMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4" />
                {reviewMutation.isPending ? 'Rejecting...' : 'Reject Proposal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
