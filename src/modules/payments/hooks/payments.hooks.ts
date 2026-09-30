import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ["payments", "plans"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any[] }>("/payments/plans");
      return response.data;
    },
  });
};

export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: ["payments", "subscription"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any }>("/payments/subscription");
      return response.data;
    },
  });
};

export const usePaymentTransactions = () => {
  return useQuery({
    queryKey: ["payments", "transactions"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any[] }>("/payments/transactions?type=SUBSCRIPTION");
      return response.data;
    },
  });
};

export const usePaymentInvoices = () => {
  return useQuery({
    queryKey: ["payments", "invoices"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any[] }>("/payments/invoices");
      return response.data;
    },
  });
};

export const usePaymentDashboard = () => {
  return useQuery({
    queryKey: ["payments", "dashboard"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any }>("/payments/dashboard");
      return response.data;
    },
  });
};

export const useUpdateBillingProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchApi<{ data: any }>("/payments/billing-profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "subscription"] });
    },
  });
};

export const useCheckout = () => {
  return useMutation({
    mutationFn: async (data: { planId: string; successUrl: string; cancelUrl: string; couponCode?: string }) => {
      const response = await fetchApi<{ data: { url: string } }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetchApi<{ data: any }>(`/payments/coupons/validate?code=${code}`);
      return response.data;
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { paymentId: string; amount?: number; reason?: string }) => {
      const response = await fetchApi<{ data: any }>("/payments/refund", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "dashboard"] });
    },
  });
};

export const exportPaymentsCSV = async () => {
  const token = localStorage.getItem("ascent_token");
  const response = await fetch(`${import.meta.env['VITE_API_URL'] || "http://localhost:3000/api/v1"}/payments/export?format=csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-organization-id": localStorage.getItem("ascent_active_org") || "",
    },
  });
  
  if (!response.ok) throw new Error("Export failed");
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments_${new Date().getTime()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// --- Event Registration Hooks ---

export const useEventRegistrationCheckout = () => {
  return useMutation({
    mutationFn: async (data: { eventId: string; successUrl: string; cancelUrl: string }) => {
      const response = await fetchApi<{ data: { url: string } }>("/payments/event-registration/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};

export const useVerifyEventRegistrationPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: string }) => {
      const response = await fetchApi<{ data: any }>("/payments/event-registration/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant", "events", "discover"] });
      queryClient.invalidateQueries({ queryKey: ["participant", "registrations"] });
    },
  });
};

export const useMyTransactions = () => {
  return useQuery({
    queryKey: ["payments", "my-transactions"],
    queryFn: async () => {
      const response = await fetchApi<{ data: any[] }>("/payments/my-transactions");
      return response.data;
    },
  });
};

export const useManagerTransactions = (eventId?: string) => {
  return useQuery({
    queryKey: ["payments", "manager", "transactions", eventId],
    queryFn: async () => {
      const url = eventId ? `/payments/manager/transactions?eventId=${eventId}` : "/payments/manager/transactions";
      const response = await fetchApi<{ data: any[] }>(url);
      return response.data;
    },
  });
};

export const useManagerEventRevenue = (eventId: string) => {
  return useQuery({
    queryKey: ["payments", "manager", "revenue", eventId],
    queryFn: async () => {
      const response = await fetchApi<{ data: any }>(`/payments/manager/events/${eventId}/revenue`);
      return response.data;
    },
    enabled: !!eventId,
  });
};

export const useRefundEventPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { paymentId: string; amount?: number; reason?: string }) => {
      const response = await fetchApi<{ data: any }>(`/payments/manager/payments/${data.paymentId}/refund`, {
        method: "POST",
        body: JSON.stringify({ amount: data.amount, reason: data.reason }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "manager"] });
    },
  });
};
