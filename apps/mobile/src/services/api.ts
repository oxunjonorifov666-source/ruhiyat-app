import { API_BASE_URL } from '../config';
import { ApiError } from '../lib/ApiError';

function parseApiErrorJson(body: Record<string, unknown>, status: number): ApiError {
  const msg =
    typeof body.message === 'string'
      ? body.message
      : Array.isArray(body.message)
        ? String(body.message[0] ?? '')
        : typeof body.error === 'string'
          ? body.error
          : `Xatolik: ${status}`;
  const code =
    typeof body.code === 'string' && body.code.length > 0
      ? body.code
      : status === 403
        ? 'FORBIDDEN'
        : status === 401
          ? 'UNAUTHORIZED'
          : 'API_ERROR';
  const path = typeof body.path === 'string' ? body.path : undefined;
  return new ApiError(msg || `Xatolik: ${status}`, status, code, path);
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh: ((a: string, r: string) => void) | null = null;
  private onAuthFailed: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  setCallbacks(onTokenRefresh: (a: string, r: string) => void, onAuthFailed: () => void) {
    this.onTokenRefresh = onTokenRefresh;
    this.onAuthFailed = onAuthFailed;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    const config: RequestInit = { method, headers };
    if (body !== undefined) config.body = JSON.stringify(body);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, config);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
        throw new ApiError(
          "Internet yo‘q yoki serverga ulanib bo‘lmadi. Ulanishni tekshiring.",
          0,
          'NETWORK_ERROR',
        );
      }
      throw e instanceof Error ? e : new ApiError(msg, 0, 'NETWORK_ERROR');
    }

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        try {
          response = await fetch(`${this.baseUrl}${path}`, { ...config, headers });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
            throw new ApiError(
              "Internet yo‘q yoki serverga ulanib bo‘lmadi.",
              0,
              'NETWORK_ERROR',
            );
          }
          throw e instanceof Error ? e : new ApiError(msg, 0, 'NETWORK_ERROR');
        }
      } else {
        this.onAuthFailed?.();
        throw new ApiError('Sessiya tugadi. Qayta kiring.', 401, 'SESSION_EXPIRED');
      }
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      throw parseApiErrorJson(error, response.status);
    }

    return response.json();
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json() as any;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.onTokenRefresh?.(data.accessToken, data.refreshToken);
      return true;
    } catch { return false; }
  }

  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let url = path;
    if (params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }
    return this.request<T>('GET', url);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError } from '../lib/ApiError';
