import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';

export const participantKeys = {
  all: ['participant'] as const,
  dashboard: () => [...participantKeys.all, 'dashboard'] as const,
  discoverEvents: () => [...participantKeys.all, 'discoverEvents'] as const,
  registrations: () => [...participantKeys.all, 'registrations'] as const,
  teams: () => [...participantKeys.all, 'teams'] as const,
  submissions: () => [...participantKeys.all, 'submissions'] as const,
  certificates: () => [...participantKeys.all, 'certificates'] as const,
  achievements: () => [...participantKeys.all, 'achievements'] as const,
  notifications: () => [...participantKeys.all, 'notifications'] as const,
};

export const useParticipantDashboard = () => {
  return useQuery({
    queryKey: participantKeys.dashboard(),
    queryFn: async () => {
      const response = await fetchApi('/participant/dashboard/stats');
      return response.data;
    },
  });
};

export const useDiscoverEvents = () => {
  return useQuery({
    queryKey: participantKeys.discoverEvents(),
    queryFn: async () => {
      const response = await fetchApi('/participant/events/discover');
      return response.data;
    },
  });
};

export const useMyRegistrations = () => {
  return useQuery({
    queryKey: participantKeys.registrations(),
    queryFn: async () => {
      const response = await fetchApi('/participant/registrations');
      return response.data;
    },
  });
};

export const useMyTeams = () => {
  return useQuery({
    queryKey: participantKeys.teams(),
    queryFn: async () => {
      const response = await fetchApi('/participant/teams');
      return response.data;
    },
  });
};

export const useMySubmissions = () => {
  return useQuery({
    queryKey: participantKeys.submissions(),
    queryFn: async () => {
      const response = await fetchApi('/participant/submissions');
      return response.data;
    },
  });
};

export const useMyCertificates = () => {
  return useQuery({
    queryKey: participantKeys.certificates(),
    queryFn: async () => {
      const response = await fetchApi('/participant/certificates');
      return response.data;
    },
  });
};

export const useMyAchievements = () => {
  return useQuery({
    queryKey: participantKeys.achievements(),
    queryFn: async () => {
      const response = await fetchApi('/participant/achievements');
      return response.data;
    },
  });
};

export const useMyNotifications = () => {
  return useQuery({
    queryKey: participantKeys.notifications(),
    queryFn: async () => {
      const response = await fetchApi('/participant/notifications');
      return response.data;
    },
  });
};

// Mutations
export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: string }) => {
      const response = await fetchApi('/participant/registrations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.registrations() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
    },
  });
};

export const useRegisterTeamForEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: string; teamName: string; competitionId: string; members: string[] }) => {
      const response = await fetchApi('/participant/registrations/team', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.registrations() });
      queryClient.invalidateQueries({ queryKey: participantKeys.teams() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
    },
  });
};

export const useWithdrawRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/participant/registrations/${id}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.registrations() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
    },
  });
};

export const useCreateParticipantTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; competitionId: string }) => {
      const response = await fetchApi('/participant/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.teams() }),
  });
};

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const response = await fetchApi(`/participant/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.teams() }),
  });
};

export const useAcceptTeamInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetchApi(`/participant/teams/invites/${inviteId}/accept`, {
        method: 'PATCH',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.teams() }),
  });
};

export const useCreateParticipantSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { teamId: string; content: string; competitionId: string }) => {
      const response = await fetchApi('/participant/submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.submissions() }),
  });
};

export const useUpdateParticipantSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchApi(`/participant/submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.submissions() }),
  });
};

export const useProblemStatements = () => {
  return useQuery({
    queryKey: ['problem-statements'],
    queryFn: async () => {
      const response = await fetchApi('/problem-statements?mode=student');
      return response.data;
    },
  });
};

export const useSelectProblemStatement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (problemStatementId: string) => {
      const response = await fetchApi('/problem-statements/select', {
        method: 'POST',
        body: JSON.stringify({ problemStatementId }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-statements'] });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: participantKeys.teams() });
    },
  });
};

export const useUploadSubmissionFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, fileData }: { submissionId: string; fileData: { fileName: string; fileSize: number; fileType: string; fileUrl?: string; description?: string | undefined } }) => {
      const response = await fetchApi(`/submissions/${submissionId}/upload`, {
        method: 'POST',
        body: JSON.stringify(fileData),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
    },
  });
};

export const useFinalSubmitSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetchApi(`/submissions/${submissionId}/final-submit`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantKeys.notifications() }),
  });
};
