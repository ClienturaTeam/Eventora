import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvaluationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CORRECTION_REQUESTED";

export interface ApiEvaluation {
  id: string;
  submissionId: string;
  judgeId: string;
  score: number | null;
  feedback: string | null;
  status: EvaluationStatus;
  recommendation?: string | null;
  criteriaScores?: Record<string, number> | null;
  isLocked?: boolean;
  lockedAt?: string | null;
  correctionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  submission?: {
    title: string;
    status: string;
    competition?: { name: string; event?: { name: string }; rubric?: any };
    team?: { name: string };
  };
  judge?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface CreateEvaluationInput {
  submissionId: string;
  judgeId: string;
}

export interface UpdateEvaluationInput {
  score?: number;
  scores?: Record<string, number>;
  feedback?: string;
  status?: EvaluationStatus;
  recommendation?: "QUALIFY" | "REJECT" | string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** All evaluations in the tenant (admin view) */
export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const res = await fetchApi("/evaluations");
      return res.data as ApiEvaluation[];
    },
  });
}

/** My evaluations as the current logged-in judge */
export function useMyEvaluations() {
  return useQuery({
    queryKey: ["evaluations", "my"],
    queryFn: async () => {
      const res = await fetchApi("/evaluations/my");
      return res.data as ApiEvaluation[];
    },
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ["evaluations", id],
    queryFn: async () => {
      const res = await fetchApi(`/evaluations/${id}`);
      return res.data as ApiEvaluation;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEvaluationInput) => {
      const res = await fetchApi("/evaluations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data as ApiEvaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateEvaluationInput & { id: string }) => {
      const res = await fetchApi(`/evaluations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data as ApiEvaluation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["evaluations", variables.id] });
    },
  });
}

export function useRequestCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetchApi(`/evaluations/${id}/request-correction`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      return res.data as ApiEvaluation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["evaluations", variables.id] });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApi(`/evaluations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}
