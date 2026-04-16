import { getStoredTokens, storeTokens, clearTokens } from './auth';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

interface RequestOptions {
  method?: string;
  body?: any;
  params?: Record<string, string | number | undefined>;
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiClient<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const tokens = getStoredTokens();
  const url = API_URL.startsWith('http')
    ? new URL(`${API_URL}${path}`)
    : new URL(`${API_URL}${path}`, window.location.origin);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {};
  if (tokens?.accessToken) headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  if (options.body) headers['Content-Type'] = 'application/json';

  let res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && tokens?.refreshToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Sessiya tugadi');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Xatolik: ${res.status}`);
  }

  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
