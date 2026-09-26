import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export type ApiEventRound = {
  id: string;
  eventId: string;
  roundNumber: number;
  name: string;
  description: string | null;
  maxMarks: number;
  submissionType: string;
  startDate: string | null;
  endDate: string | null;
  isLocked: boolean;
};

export type ApiEvent = {
  id: string;
  name: string;
  description: string | null;
  rules?: string | null;
  status: "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "CANCELLED";
  startTime: string;
  endTime: string;
  organizationId: string;
  price: number;
  currency: string;
  registrationType?: "INDIVIDUAL" | "TEAM";
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  competitions?: any[];
  rounds?: ApiEventRound[];
  problemStatements?: any[];
  revenue?: number;
  teamMembers?: any[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  name: string;
  description?: string;
  rules?: string;
  startTime: string;
  endTime: string;
  status?: string;
};

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetchApi("/events");
      return res.data as ApiEvent[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const res = await fetchApi(`/events/${id}`);
      return res.data as ApiEvent;
    },
    enabled: !!id,
  });
}

export function useEventRounds(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "rounds"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${eventId}/rounds`);
      return res.data as ApiEventRound[];
    },
    enabled: !!eventId,
  });
}

export function useEventDashboard(id: string) {
  return useQuery({
    queryKey: ["events", id, "dashboard"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${id}/dashboard`);
      return res.data as {
        registrationTrend: any[];
        metrics: {
          registrations: number;
          teams: number;
          submissions: number;
          revenue: number;
        };
      };
    },
    enabled: !!id,
  });
}

export function useEventSessions(id: string) {
  return useQuery({
    queryKey: ["events", id, "sessions"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${id}/sessions`);
      return res.data as {
        id: string;
        name: string;
        description: string;
        startTime: string;
        endTime: string;
        status: string;
      }[];
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEventInput) => {
      const res = await fetchApi("/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data as ApiEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateEventInput> & { id: string }) => {
      const res = await fetchApi(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data as ApiEvent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApi(`/events/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export type ExecutionSummary = {
  eventId: string;
  eventName: string;
  status: string;
  registrations: {
    totalRegistered: number;
    approvedParticipants: number;
    paidParticipants: number;
  };
  attendance: {
    totalAttendanceSessions: number;
    uniqueAttendees: number;
    attendancePercentage: number;
  };
  competition: {
    totalCompetitions: number;
    totalTeams: number;
    totalSubmissions: number;
    totalWinners: number;
  };
  volunteers: {
    totalVolunteers: number;
    totalVolunteerHours: number;
  };
};

export function useExecutionSummary(id: string) {
  return useQuery({
    queryKey: ["events", id, "execution-summary"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${id}/execution-summary`);
      return res.data as ExecutionSummary;
    },
    enabled: !!id,
  });
}

export function useCompleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/events/${id}/complete`, { method: "POST" });
      return res.data as ApiEvent;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      queryClient.invalidateQueries({ queryKey: ["events", id, "execution-summary"] });
    },
  });
}

export function useEventRegistrations(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "registrations"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${eventId}/registrations`);
      return res.data as any[];
    },
    enabled: !!eventId,
  });
}

export function useUpdateEventRegistrationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, regId, data }: { eventId: string; regId: string; data: { status: string } }) => {
      const res = await fetchApi(`/events/${eventId}/registrations/${regId}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registrations"] });
      // Invalidate dashboard metrics as registration status changes can affect stats
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

export type EventTeamMember = {
  id: string;
  eventId: string;
  userId: string;
  responsibility: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export function useEventTeam(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "team"],
    queryFn: async () => {
      const res = await fetchApi(`/events/${eventId}/team`);
      return res.data as EventTeamMember[];
    },
    enabled: !!eventId,
  });
}

export function useAddEventTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId, responsibility }: { eventId: string; userId: string; responsibility: string }) => {
      const res = await fetchApi(`/events/${eventId}/team`, {
        method: "POST",
        body: JSON.stringify({ userId, responsibility }),
      });
      return res.data as EventTeamMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}

export function useUpdateEventTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId, responsibility }: { eventId: string; memberId: string; responsibility: string }) => {
      const res = await fetchApi(`/events/${eventId}/team/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ responsibility }),
      });
      return res.data as EventTeamMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}

export function useRemoveEventTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId }: { eventId: string; memberId: string }) => {
      await fetchApi(`/events/${eventId}/team/${memberId}`, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}

export function useAssignedEvents() {
  return useQuery({
    queryKey: ["events", "assigned"],
    queryFn: async () => {
      const res = await fetchApi("/events/assigned");
      return res.data as ApiEvent[];
    },
  });
}

export function useAssignFacultyCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const res = await fetchApi(`/events/${eventId}/assignment/faculty`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      return res.data as EventTeamMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}

export function useAssignStudentCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const res = await fetchApi(`/events/${eventId}/assignment/student`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      return res.data as EventTeamMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}

export function useRemoveStudentCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId }: { eventId: string; memberId: string }) => {
      await fetchApi(`/events/${eventId}/assignment/student/${memberId}`, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "team"] });
    },
  });
}
