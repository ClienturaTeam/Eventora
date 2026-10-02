import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiMentor {
  id: string;
  userId: string;
  organizationId: string;
  expertise: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  teamAssignments?: Array<{
    id: string;
    teamId: string;
    assignedAt: string;
    team: {
      id: string;
      name: string;
      competition: { id: string; name: string };
    };
  }>;
}

export interface CreateMentorInput {
  userId: string;
  expertise?: string;
  bio?: string;
}

export interface UpdateMentorInput {
  expertise?: string;
  bio?: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useMentors() {
  return useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const res = await fetchApi("/mentors");
      return res.data as ApiMentor[];
    },
  });
}

export function useMentor(id: string) {
  return useQuery({
    queryKey: ["mentors", id],
    queryFn: async () => {
      const res = await fetchApi(`/mentors/${id}`);
      return res.data as ApiMentor;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMentorInput) => {
      const res = await fetchApi("/mentors", { method: "POST", body: JSON.stringify(data) });
      return res.data as ApiMentor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

export function useUpdateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateMentorInput & { id: string }) => {
      const res = await fetchApi(`/mentors/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return res.data as ApiMentor;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      queryClient.invalidateQueries({ queryKey: ["mentors", vars.id] });
    },
  });
}

export function useDeleteMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApi(`/mentors/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

export function useAssignMentorTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorId, teamId }: { mentorId: string; teamId: string }) => {
      const res = await fetchApi(`/mentors/${mentorId}/teams`, {
        method: "POST",
        body: JSON.stringify({ teamId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

// ─── Mentor Q&A Types & Hooks ──────────────────────────────────────────────────

export interface ApiQuestionReply {
  id: string;
  questionId: string;
  senderId?: string;
  message?: string;
  reply?: string;
  createdAt: string;
  sender?: { id: string; firstName: string | null; lastName: string | null; email: string };
  user?: { firstName: string | null; lastName: string | null; email: string; role?: string };
}

export interface ApiMentorQuestion {
  id: string;
  organizationId?: string;
  eventId: string;
  roundId: string | null;
  participantId?: string;
  mentorId?: string;
  subject?: string;
  question: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  participant?: { id: string; firstName: string | null; lastName: string | null; email: string };
  mentor?: { id: string; firstName: string | null; lastName: string | null; email: string };
  user?: { firstName: string | null; lastName: string | null; email: string };
  event?: { id: string; title?: string; name?: string };
  round?: { id: string; roundNumber?: number; name?: string };
  team?: { id: string; name: string } | null;
  problemStatement?: { id: string; code?: string; title?: string; description?: string; category?: string } | null;
  replies?: ApiQuestionReply[];
}

export function useMentorQuestions(eventId?: string, roundId?: string) {
  return useQuery({
    queryKey: ["mentorQuestions", { eventId, roundId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append("eventId", eventId);
      if (roundId) params.append("roundId", roundId);
      const res = await fetchApi(`/mentors/questions?${params.toString()}`);
      return res.data as ApiMentorQuestion[];
    },
  });
}

export function useAskMentorQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: string; roundId?: string; question: string }) => {
      const res = await fetchApi("/mentors/questions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data as ApiMentorQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorQuestions"] });
    },
  });
}

export function useReplyMentorQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, reply }: { questionId: string; reply: string }) => {
      const res = await fetchApi(`/mentors/questions/${questionId}/replies`, {
        method: "POST",
        body: JSON.stringify({ reply }),
      });
      return res.data as ApiQuestionReply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorQuestions"] });
    },
  });
}

