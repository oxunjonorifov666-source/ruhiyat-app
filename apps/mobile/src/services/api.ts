import { API_BASE_URL } from '../config';
import { ApiError } from '../lib/ApiError';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'refreshToken',
  'accessToken',
  'token',
  'code',
  'resetToken',
]);

function redactForLog(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactForLog);
  if (typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = redactForLog(v) as unknown;
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** EAS: EXPO_PUBLIC_API_DEBUG=true yoki __DEV__ — auth so‘rovlarda qisqa log */
function authDebugEnabled(): boolean {
  return (
    typeof __DEV__ !== 'undefined' &&
    (__DEV__ === true ||
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_DEBUG === 'true'))
  );
}

function authDebugLog(phase: string, info: Record<string, unknown>): void {
  if (!authDebugEnabled()) return;
  try {
    console.warn(`[API ${phase}]`, JSON.stringify(redactForLog(info), null, 0));
  } catch {
    console.warn(`[API ${phase}]`, info);
  }
}

/** Backend ba'zan { success: true, data: T } yuborishi mumkin — mobil esa tekis AuthResponse kutadi */
export function unwrapApiSuccessBody<T>(raw: unknown): T {
  if (raw === null || raw === undefined) {
    throw new ApiError('Server bo‘sh javob qaytardi', 500, 'EMPTY_RESPONSE');
  }
  if (typeof raw === 'object' && raw !== null && 'success' in raw) {
    const r = raw as Record<string, unknown>;
    if (r.success === false) {
      throw parseApiErrorJson(r, typeof r.statusCode === 'number' ? (r.statusCode as number) : 400);
    }
    if (r.success === true && 'data' in r && r.data !== undefined) {
      return r.data as T;
    }
  }
  return raw as T;
}

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

  let displayMsg = msg || `Xatolik: ${status}`;
  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    code.startsWith('PRISMA_')
  ) {
    displayMsg = `${displayMsg} [${code}]`;
  }

  return new ApiError(displayMsg, status, code, path);
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

    const isAuthPath =
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/password') ||
      path.startsWith('/auth/otp');

    if (isAuthPath) {
      authDebugLog('request', {
        method,
        url: `${this.baseUrl}${path}`,
        body: body === undefined ? undefined : redactForLog(body),
      });
    }

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

    /** Login/register/OTP/parol tiklash 401 — bu “noto‘g‘ri parol”; refresh qilmaslik */
    const skipRefreshOn401 =
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/otp') ||
      path.startsWith('/auth/password') ||
      path.startsWith('/auth/verify-password');

    if (response.status === 401 && this.refreshToken && !skipRefreshOn401 && !path.startsWith('/auth/refresh')) {
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

    const rawJson: unknown = await response.json().catch(() => ({}));

    if (isAuthPath) {
      authDebugLog('response', {
        path,
        status: response.status,
        ok: response.ok,
        body: redactForLog(rawJson),
      });
    }

    if (!response.ok) {
      const error = (rawJson && typeof rawJson === 'object' ? rawJson : {}) as Record<string, unknown>;
      throw parseApiErrorJson(error, response.status);
    }

    if (rawJson && typeof rawJson === 'object' && rawJson !== null && 'success' in rawJson) {
      const r = rawJson as Record<string, unknown>;
      if (r.success === false) {
        throw parseApiErrorJson(r as Record<string, unknown>, response.status);
      }
    }

    return unwrapApiSuccessBody<T>(rawJson);
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const raw: unknown = await res.json().catch(() => ({}));
      const data = unwrapApiSuccessBody<{ accessToken?: string; refreshToken?: string }>(raw) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken || !data.refreshToken) return false;
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

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError } from '../lib/ApiError';
