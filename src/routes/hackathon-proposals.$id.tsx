import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/hackathon-proposals/$id')({
  component: ProposalDetailsComponent,
});

function ProposalDetailsComponent() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = user?.memberships?.[0]?.role?.permissions?.map(p => p.permission.action) || [];
  const hasGlobalCreateEvent = permissions.includes('hackathon_proposals.create_event');
  const hasCreateEventOwn = permissions.includes('hackathon_proposals.create_event_own');

  const { data: response, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const res = await fetchApi(`/hackathon-proposals/${id}`);
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await fetchApi(`/hackathon-proposals/${id}/submit`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  const proposal = response;
  if (!proposal) return <div className="p-6">Proposal not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-900 rounded-full text-sm font-semibold">
            Status: {proposal.status}
          </span>
        </div>
        {(proposal.status === 'DRAFT' || proposal.status === 'CHANGES_REQUESTED') && (
          <div className="flex items-center gap-3">
            <a 
              href={`/hackathon-proposals/${proposal.id}/edit`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 font-medium inline-block text-center"
            >
              Edit Proposal
            </a>
            <button 
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit to Manager'}
            </button>
          </div>
        )}
        {proposal.status === 'PRINCIPAL_APPROVED' && (hasGlobalCreateEvent || (hasCreateEventOwn && proposal.submittedById === user?.id)) && (
          <Link 
            to="/events/new"
            search={{ proposalId: proposal.id }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-semibold"
          >
            Create Event
          </Link>
        )}
        {proposal.status === 'EVENT_CREATED' && proposal.event && (
          <Link 
            to="/events/$id"
            params={{ id: proposal.event.id }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
          >
            View Event
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 bg-card p-6 border rounded shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p className="font-medium">{proposal.description || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Expected Participants</p>
          <p className="font-medium">{proposal.expectedParticipants}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Estimated Budget</p>
          <p className="font-medium">₹{Number(proposal.estimatedBudget || 0).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Required Manpower</p>
          <p className="font-medium">{proposal.requiredManpower}</p>
        </div>
        {proposal.managerComment && (
          <div className="col-span-2 mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-semibold mb-1">Manager Feedback:</p>
            <p className="text-red-700">{proposal.managerComment}</p>
          </div>
        )}
        {proposal.principalComment && (
          <div className="col-span-2 mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-semibold mb-1">Principal Feedback:</p>
            <p className="text-red-700">{proposal.principalComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
