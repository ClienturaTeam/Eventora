import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export const useWinnersDashboard = () => {
  return useQuery({
    queryKey: ["winners-dashboard"],
    queryFn: () => fetchApi<{ data: any }>("/winners/dashboard").then((res) => res.data),
  });
};

export const useWinners = (competitionId?: string) => {
  return useQuery({
    queryKey: ["winners", competitionId],
    queryFn: () => {
      const qs = competitionId ? `?competitionId=${competitionId}` : "";
      return fetchApi<{ data: any }>(`/winners${qs}`).then((res) => res.data);
    },
  });
};

export const useWinner = (id: string) => {
  return useQuery({
    queryKey: ["winners", id],
    queryFn: () => fetchApi<{ data: any }>(`/winners/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useSelectWinner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<{ data: any }>("/winners", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["winners"] });
      queryClient.invalidateQueries({ queryKey: ["winners-dashboard"] });
    },
  });
};

export const useFinalizeWinner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ data: any }>(`/winners/${id}/finalize`, {
        method: "POST",
      }).then((res) => res.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["winners"] });
      queryClient.invalidateQueries({ queryKey: ["winners", id] });
      queryClient.invalidateQueries({ queryKey: ["winners-dashboard"] });
    },
  });
};

export const usePrizes = (competitionId?: string) => {
  return useQuery({
    queryKey: ["prizes", competitionId],
    queryFn: () => {
      const qs = competitionId ? `?competitionId=${competitionId}` : "";
      return fetchApi<{ data: any }>(`/winners/prizes${qs}`).then((res) => res.data);
    },
  });
};

export const useFinalists = (competitionId?: string) => {
  return useQuery({
    queryKey: ["finalists", competitionId],
    queryFn: () => {
      if (!competitionId) return Promise.resolve([]);
      return fetchApi<{ data: any[] }>(`/winners/finalists?competitionId=${competitionId}`).then((res) => res.data);
    },
    enabled: !!competitionId,
  });
};

export const useUpdatePrizeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PENDING" | "PROCESSING" | "PAID" }) =>
      fetchApi<{ data: any }>(`/winners/prizes/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
      queryClient.invalidateQueries({ queryKey: ["winners-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["winners"] });
    },
  });
};

export const usePublishResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { competitionId: string; teamId: string; resultType: string; prizeAmount?: number; currency?: string }) =>
      fetchApi<{ data: any }>("/manager/results/publish", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["winners"] });
      queryClient.invalidateQueries({ queryKey: ["winners-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finalists"] });
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
};
