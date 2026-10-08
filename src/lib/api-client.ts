import { appLogger } from "./app-logger";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const envUrl = import.meta.env['VITE_API_URL'];
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    return `${protocol}//${hostname}:3000/api/v1`;
  }
  return import.meta.env['VITE_API_URL'] || 'http://localhost:3000/api/v1';
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.status = status;
    if (code !== undefined) this.code = code;
    if (details !== undefined) this.details = details;
    this.name = 'ApiError';
  }
}

export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem('ascent_token') : null;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const activeOrgId = typeof window !== "undefined" ? localStorage.getItem('ascent_active_org') : null;
  if (activeOrgId) {
    headers.set('x-organization-id', activeOrgId);
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const method = options.method || 'GET';
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = performance.now() - startTime;
    appLogger.debug(`[HTTP ${method}] ${endpoint} ${response.status} (${duration.toFixed(1)}ms)`);

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      let errorCode;
      let errorDetails;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code;
          errorDetails = errorData.error.details;
        }
      } catch (e) {
        errorMessage = response.statusText;
      }

      appLogger.warn(`[API ERROR ${response.status}] ${method} ${endpoint}: ${errorMessage}`, {
        code: errorCode,
        status: response.status,
      });

      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      if (errorCode === "MFA_REQUIRED_FOR_TENANT") {
        window.dispatchEvent(new CustomEvent('auth:mfa_required'));
      }

      throw new ApiError(response.status, errorMessage, errorCode, errorDetails);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    if (!(error instanceof ApiError)) {
      appLogger.error(error, { mechanism: "manual", context: { endpoint, method } });
    }
    throw error;
  }
}
