import axios from "axios";
import { env } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth/token";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const AUTH_BYPASS_PATHS = new Set([
  "/api/auth/email-login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/resend-verification",
  "/api/auth/verify-email",
  "/api/auth/refresh",
]);

function shouldBypassAuthRedirect(url?: string): boolean {
  if (!url) return false;

  try {
    const pathname = url.startsWith("http")
      ? new URL(url).pathname
      : new URL(url, env.NEXT_PUBLIC_API_URL).pathname;
    return AUTH_BYPASS_PATHS.has(pathname);
  } catch {
    return AUTH_BYPASS_PATHS.has(url);
  }
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb: (token: string) => void) => {
    cb(token);
  });
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (shouldBypassAuthRedirect(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = response.data.access_token;
        setAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
