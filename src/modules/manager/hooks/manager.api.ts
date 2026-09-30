import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';

export const managerKeys = {
  all: ['manager'] as const,
  dashboard: () => [...managerKeys.all, 'dashboard'] as const,
  events: () => [...managerKeys.all, 'events'] as const,
  registrations: () => [...managerKeys.all, 'registrations'] as const,
  teams: () => [...managerKeys.all, 'teams'] as const,
  submissions: () => [...managerKeys.all, 'submissions'] as const,
  evaluations: () => [...managerKeys.all, 'evaluations'] as const,
  judges: () => [...managerKeys.all, 'judges'] as const,
  mentors: () => [...managerKeys.all, 'mentors'] as const,
  volunteers: () => [...managerKeys.all, 'volunteers'] as const,
  attendance: () => [...managerKeys.all, 'attendance'] as const,
  certificates: () => [...managerKeys.all, 'certificates'] as const,
  reports: () => [...managerKeys.all, 'reports'] as const,
};

export const useManagerDashboard = () => {
  return useQuery({
    queryKey: managerKeys.dashboard(),
    queryFn: async () => {
      const response = await fetchApi('/manager/dashboard/stats');
      return response.data;
    },
  });
};

export const useManagerEvents = () => {
  return useQuery({
    queryKey: managerKeys.events(),
    queryFn: async () => {
      const response = await fetchApi('/manager/events');
      return response.data;
    },
  });
};

export const useManagerRegistrations = () => {
  return useQuery({
    queryKey: managerKeys.registrations(),
    queryFn: async () => {
      const response = await fetchApi('/manager/registrations');
      return response.data;
    },
  });
};

export const useManagerTeams = () => {
  return useQuery({
    queryKey: managerKeys.teams(),
    queryFn: async () => {
      const response = await fetchApi('/manager/teams');
      return response.data;
    },
  });
};

export const useManagerSubmissions = () => {
  return useQuery({
    queryKey: managerKeys.submissions(),
    queryFn: async () => {
      const response = await fetchApi('/manager/submissions');
      return response.data;
    },
  });
};

export const useManagerEvaluations = (filters?: { eventId?: string | undefined; roundId?: string | undefined; roundNumber?: number | string | undefined }) => {
  return useQuery({
    queryKey: [...managerKeys.evaluations(), filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventId && filters.eventId !== "ALL") params.set("eventId", filters.eventId);
      if (filters?.roundId) params.set("roundId", filters.roundId);
      if (filters?.roundNumber !== undefined && filters?.roundNumber !== null) params.set("roundNumber", String(filters.roundNumber));
      const queryString = params.toString();
      const response = await fetchApi(`/manager/evaluations${queryString ? `?${queryString}` : ""}`);
      return response.data;
    },
  });
};

export const useManagerJudges = () => {
  return useQuery({
    queryKey: managerKeys.judges(),
    queryFn: async () => {
      const response = await fetchApi('/manager/judges');
      return response.data;
    },
  });
};

export const useManagerMentors = () => {
  return useQuery({
    queryKey: managerKeys.mentors(),
    queryFn: async () => {
      const response = await fetchApi('/manager/mentors');
      return response.data;
    },
  });
};

export const useManagerVolunteers = () => {
  return useQuery({
    queryKey: managerKeys.volunteers(),
    queryFn: async () => {
      const response = await fetchApi('/manager/volunteers');
      return response.data;
    },
  });
};

export const useManagerAttendance = () => {
  return useQuery({
    queryKey: managerKeys.attendance(),
    queryFn: async () => {
      const response = await fetchApi('/manager/attendance');
      return response.data;
    },
  });
};

export const useManagerCertificates = () => {
  return useQuery({
    queryKey: managerKeys.certificates(),
    queryFn: async () => {
      const response = await fetchApi('/manager/certificates');
      return response.data;
    },
  });
};

export const useManagerReports = () => {
  return useQuery({
    queryKey: managerKeys.reports(),
    queryFn: async () => {
      const response = await fetchApi('/manager/reports');
      return response.data;
    },
  });
};

// Mutations
export const useCreateManagerEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.events() }),
  });
};

export const useUpdateManagerEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.events() }),
  });
};

export const useDeleteManagerEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/manager/events/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.events() }),
  });
};

export const useUpdateManagerRegistrationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/registrations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.registrations() }),
  });
};

export const useCreateManagerTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.teams() }),
  });
};

export const useUpdateManagerTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.teams() }),
  });
};

export const useDeleteManagerTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/manager/teams/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.teams() }),
  });
};

export const useUpdateManagerSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.submissions() }),
  });
};

export const useCreateManagerEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/evaluations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.evaluations() }),
  });
};

export const useUpdateManagerEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/evaluations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.evaluations() }),
  });
};

export const useAssignManagerJudge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/judges', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.judges() }),
  });
};

export const useAssignJudgeCompetition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ judgeId, competitionId }: { judgeId: string; competitionId: string }) => {
      const response = await fetchApi(`/judges/${judgeId}/competitions`, {
        method: 'POST',
        body: JSON.stringify({ competitionId }),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.judges() }),
  });
};

export const useRemoveManagerJudge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/manager/judges/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.judges() }),
  });
};

export const useAssignManagerMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/mentors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.mentors() }),
  });
};

export const useRemoveManagerMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/manager/mentors/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.mentors() }),
  });
};

export const useAssignManagerVolunteer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/volunteers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.volunteers() }),
  });
};

export const useRemoveManagerVolunteer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/manager/volunteers/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.volunteers() }),
  });
};

export const useIssueManagerCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi('/manager/certificates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.certificates() }),
  });
};

export const useUpdateManagerCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/manager/certificates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managerKeys.certificates() }),
  });
};

export const usePublishManagerResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { competitionId: string; teamId: string; resultType: string; prizeAmount?: number; currency?: string }) => {
      const response = await fetchApi('/manager/results/publish', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.evaluations() });
      queryClient.invalidateQueries({ queryKey: managerKeys.certificates() });
      queryClient.invalidateQueries({ queryKey: managerKeys.teams() });
    },
  });
};
