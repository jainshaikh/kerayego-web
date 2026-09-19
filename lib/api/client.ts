import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Exported so the /ride Socket.IO client (lib/realtime/ride-socket.ts) can
// derive the gateway's origin from the same source instead of re-reading the
// env var — see that file's getSocketOrigin() for why the "/v1" suffix here
// has to be stripped first.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

// In-memory access token — never persisted to localStorage (XSS protection)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Single shared Axios instance for all API modules
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required for HTTP-only refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Injects access token into every request header automatically
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Shared refresh — single in-flight call app-wide ──────────────────────────
// Both the 401 response interceptor below and AuthBootstrap's proactive
// refresh-on-load call this. Without a single shared promise, two refresh
// attempts landing close together (React StrictMode double-invoking
// AuthBootstrap's effect in dev, or an authenticated query firing before the
// bootstrap finishes) would each present the same not-yet-rotated refresh
// token — the backend rotates it immediately, so whichever request loses the
// race gets treated as a replay and the whole session is killed. Coalescing
// every caller onto one promise means at most one POST /auth/refresh is ever
// in flight per page load.
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ data: { accessToken: string } }>('/auth/refresh')
      .then((response) => {
        const newToken = response.data.data.accessToken;
        setAccessToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ── Response interceptor ─────────────────────────────────────────────────────
// On 401: attempt silent token refresh, then retry original request once.
// On refresh failure: clear auth state and redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 from non-auth endpoints, and only once
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear auth state and redirect to login.
        // MUST remove userRole cookie so middleware doesn't redirect back and create a loop.
        setAccessToken(null);

        if (typeof window !== 'undefined') {
          Cookies.remove('userRole');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
