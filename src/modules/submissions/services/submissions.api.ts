import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export type ApiSubmission = {
  id: string;
  title: string;
  payload: Record<string, unknown> | null;
  teamId: string;
  competitionId: string;
  eventId?: string;
  roundId?: string;
  roundNumber?: number;
  problemStatementId?: string;
  status: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "EVALUATED" | "DISQUALIFIED";
  createdAt: string;
  updatedAt: string;
  competition?: { name: string; event?: { id: string; name: string } };
  event?: { id: string; name: string };
  eventRound?: { id: string; roundNumber: number; name: string; maxMarks: number };
  problemStatement?: { id: string; code: string; title: string; description: string; category?: string };
  team?: { name: string; members?: { user: { id: string; firstName: string; lastName: string } }[] };
  submittedBy?: { id: string; firstName: string; lastName: string; email: string };
  files?: { id: string; fileName: string; fileSize: number; fileType: string; fileUrl: string }[];
  judgeAssignments?: { id: string; judge: { id: string; firstName: string; lastName: string; email: string } }[];
  _count?: { evaluations: number };
  evaluations?: {
    id: string;
    score: number | null;
    feedback: string | null;
    judge: { id: string; firstName: string; lastName: string };
  }[];
};

export type CreateSubmissionInput = {
  title: string;
  payload?: Record<string, unknown>;
  teamId: string;
  competitionId: string;
  eventId?: string;
  roundId?: string;
  roundNumber?: number;
  problemStatementId?: string;
  status?: string;
};

export function useSubmissions(filters?: {
  eventId?: string | undefined;
  roundId?: string | undefined;
  roundNumber?: number | string | undefined;
  problemStatementId?: string | undefined;
  status?: string | undefined;
  judgeId?: string | undefined;
  userId?: string | undefined;
}) {
  return useQuery({
    queryKey: ["submissions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventId) params.set("eventId", filters.eventId);
      if (filters?.roundId) params.set("roundId", filters.roundId);
      if (filters?.roundNumber !== undefined && filters?.roundNumber !== null) {
        params.set("roundNumber", String(filters.roundNumber));
      }
      if (filters?.problemStatementId) params.set("problemStatementId", filters.problemStatementId);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.judgeId) params.set("judgeId", filters.judgeId);
      if (filters?.userId) params.set("userId", filters.userId);

      const queryString = params.toString();
      const res = await fetchApi(`/submissions${queryString ? `?${queryString}` : ""}`);
      return res.data as ApiSubmission[];
    },
  });
}

export function useAssignJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, judgeId }: { submissionId: string; judgeId: string }) => {
      const res = await fetchApi(`/submissions/${submissionId}/assign-judge`, {
        method: "POST",
        body: JSON.stringify({ judgeId }),
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "evaluations"] });
    },
  });
}

export function useUnassignJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, judgeId }: { submissionId: string; judgeId: string }) => {
      const res = await fetchApi(`/submissions/${submissionId}/assign-judge/${judgeId}`, {
        method: "DELETE",
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "evaluations"] });
    },
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const res = await fetchApi(`/submissions/${id}`);
      return res.data as ApiSubmission;
    },
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSubmissionInput) => {
      const res = await fetchApi("/submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data as ApiSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateSubmissionInput> & { id: string }) => {
      const res = await fetchApi(`/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data as ApiSubmission;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.id] });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApi(`/submissions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
