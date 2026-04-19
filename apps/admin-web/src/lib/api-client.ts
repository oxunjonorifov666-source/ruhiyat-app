import { storeTokens, clearTokens } from './auth';
import { getCsrfHeadersForMutations } from './api-csrf';

/** Thrown on non-OK responses; includes HTTP status for permission-aware UX. */
export class ApiHttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

interface RequestOptions {
  method?: string;
  body?: any;
  params?: Record<string, string | number | undefined>;
}

async function refreshSessionCookies(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!res.ok) return false;
    await res.json().catch(() => ({}));
    storeTokens();
    return true;
  } catch {
    return false;
  }
}

export async function apiClient<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
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

  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {};
  if (options.body) headers['Content-Type'] = 'application/json';

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    Object.assign(headers, await getCsrfHeadersForMutations());
  }

  const doFetch = () =>
    fetch(url.toString(), {
      method,
      headers,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401) {
    const ok = await refreshSessionCookies();
    if (ok) {
      res = await doFetch();
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Sessiya tugadi');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: unknown }).message
        : undefined;
    const message =
      typeof raw === 'string' && raw.trim() ? raw : `Xatolik: ${res.status}`;
    throw new ApiHttpError(message, res.status, body);
  }

  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export { getCsrfHeadersForMutations } from './api-csrf';
