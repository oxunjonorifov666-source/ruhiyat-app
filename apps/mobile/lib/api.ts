import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './env';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './auth-token';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${getApiBaseUrl()}/auth/refresh`,
        { refreshToken: refresh },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const { accessToken, refreshToken } = res.data;
      if (accessToken && refreshToken) {
        await saveTokens(accessToken, refreshToken);
        return accessToken;
      }
    } catch {
      await clearTokens();
    } finally {
      refreshPromise = null;
    }
    return null;
  })();
  return refreshPromise;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config;
    const status = error.response?.status;
    if (status !== 401 || !original || (original as any)._retry) {
      return Promise.reject(error);
    }
    (original as any)._retry = true;
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      void import('~/lib/authSessionClear').then((m) => void m.clearClientSessionAfterAuthFailure());
      return Promise.reject(error);
    }
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api.request(original);
  },
);
