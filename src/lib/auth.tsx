import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./api-client";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  memberships: {
    id: string;
    status: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
    role: {
      id: string;
      name: string;
      permissions: {
        permission: {
          id: string;
          action: string;
        }
      }[];
    };
  }[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  activeOrganization: string | null;
  setActiveOrganization: (id: string | null) => void;
  hasPermission: (action: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ascent_token");
    }
    return null;
  });
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeOrganization, setActiveOrganizationState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ascent_active_org");
    }
    return null;
  });

  const setActiveOrganization = (id: string | null) => {
    setActiveOrganizationState(id);
    if (id) {
      localStorage.setItem("ascent_active_org", id);
    } else {
      localStorage.removeItem("ascent_active_org");
    }
  };

  const { data: user, isLoading: isUserLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetchApi("/auth/me");
      return res.data as AuthUser;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set default active organization if none selected
  useEffect(() => {
    if (user?.memberships?.length && !activeOrganization) {
      const orgId = user.memberships[0]?.organization.id;
      if (orgId) setActiveOrganization(orgId);
    }
  }, [user, activeOrganization]);

  // Handle token clearing on unauthorized errors from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      toast.error("Session expired. Please log in again.");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // Auto-logout if the /auth/me call fails (e.g., token invalid)
  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = (newToken: string) => {
    localStorage.setItem("ascent_token", newToken);
    setToken(newToken);
    // Invalidate queries so the user profile is fetched immediately
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const logout = () => {
    localStorage.removeItem("ascent_token");
    localStorage.removeItem("ascent_active_org");
    setToken(null);
    setActiveOrganizationState(null);
    queryClient.clear(); // Clear all cached data on logout for security
    
    // Attempt backend logout (fire and forget)
    fetchApi("/auth/logout", { method: "POST" }).catch(() => {});
    router.navigate({ to: "/" });
  };

  const hasPermission = (action: string) => {
    if (!user) return false;
    const currentMembership = user.memberships?.find(m => m.organization.id === activeOrganization) || user.memberships?.[0];
    const permissions = currentMembership?.role?.permissions?.map(p => p.permission.action) || [];
    return permissions.includes(action);
  };

  const isLoading = !!token && isUserLoading;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      token, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout,
      activeOrganization,
      setActiveOrganization,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
