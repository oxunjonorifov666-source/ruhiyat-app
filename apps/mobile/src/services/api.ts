import { API_BASE_URL } from '@ruhiyat/config';

const BASE_URL = API_BASE_URL.startsWith('http')
  ? API_BASE_URL
  : 'http://localhost:3000/api';

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh: ((accessToken: string, refreshToken: string) => void) | null = null;
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${path}`, config);

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${this.baseUrl}${path}`, { ...config, headers });
      } else {
        this.onAuthFailed?.();
        throw new Error('Sessiya tugadi');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Xatolik: ${response.status}`);
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

      const data = await res.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.onTokenRefresh?.(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
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

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(BASE_URL);
