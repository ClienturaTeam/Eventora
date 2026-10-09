import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/manager/requests")({
  component: ManagerRequestsPage,
});

function ManagerRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["manager", "requests", "faculty-coordinator"],
    queryFn: () => fetchApi("/manager/requests/faculty-coordinator"),
  });

  const approveMutation = useMutation({
    mutationFn: (memberId: string) => 
      fetchApi(`/manager/requests/faculty-coordinator/${memberId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" })
      }),
    onSuccess: () => {
      toast.success("Request approved. Faculty Coordinator is now active.");
      queryClient.invalidateQueries({ queryKey: ["manager", "requests", "faculty-coordinator"] });
      queryClient.invalidateQueries({ queryKey: ["coordinators"] });
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => 
      fetchApi(`/manager/requests/faculty-coordinator/${memberId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED" })
      }),
    onSuccess: () => {
      toast.success("Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["manager", "requests", "faculty-coordinator"] });
    },
    onError: () => toast.error("Failed to reject request"),
  });

  return (
    <div className="p-3.5 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Faculty Coordinator Requests</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Review and manage signup requests for Faculty Coordinator accounts.</p>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Requested Role</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading requests...
                </td>
              </tr>
            ) : requests?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Check className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No Pending Requests</h3>
                  <p className="text-muted-foreground">All Faculty Coordinator requests have been processed.</p>
                </td>
              </tr>
            ) : (
              requests?.map((req: any) => (
                <tr key={req.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {req.user.firstName} {req.user.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{req.user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {req.role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(req.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => approveMutation.mutate(req.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
