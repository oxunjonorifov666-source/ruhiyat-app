import { TOKEN_KEYS } from '@ruhiyat/config';
import { VerifyPasswordError } from '@/lib/verify-password-error';
import { getCsrfHeadersForMutations } from '@/lib/api-csrf';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  permissions?: string[];
  administrator?: {
    id: number;
    centerId: number;
    position: string | null;
    center: { id: number; name: string };
  } | null;
}

export interface LoginResponse {
  user: AuthUser;
  /** Present for native/legacy clients; browser admin relies on HttpOnly cookies set by the API. */
  accessToken?: string;
  refreshToken?: string;
  refreshTtlMs?: number;
  accessTtlMs?: number;
}

const GENERIC_500_HINT =
  "Bu xato odatda NestJS API o‘chiq, PostgreSQL ulanmagan yoki Next.js proksi noto‘g‘ri portga yo‘naltirganda chiqadi. " +
  "Asset-Linker/apps/api da `pnpm dev` (standart port 3000), keyin `pnpm prisma db push` va `pnpm seed`. " +
  "API boshqa portda bo‘lsa admin-web `.env.local`: NEXT_PUBLIC_API_URL=http://localhost:PORT"

async function readApiErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  let parsedMsg = "";
  try {
    const body = JSON.parse(text) as { message?: unknown; error?: unknown };
    const msg = body.message ?? body.error;
    if (Array.isArray(msg) && msg.length) parsedMsg = String(msg[0]).trim();
    else if (typeof msg === "string") parsedMsg = msg.trim();
  } catch {
    /* HTML yoki JSON emas */
  }

  const looksGeneric =
    !parsedMsg ||
    /^internal server error$/i.test(parsedMsg) ||
    /^ichki server xatosi$/i.test(parsedMsg);

  if (looksGeneric && (res.status === 500 || res.status === 502)) {
    return GENERIC_500_HINT;
  }
  if (parsedMsg && !looksGeneric) return parsedMsg;

  if (text && text.length > 0 && text.length < 400 && !text.trimStart().startsWith("<")) {
    return text.trim();
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return "API serverga ulanib bo‘lmadi. API ishga tushirilganini va portni tekshiring (odatda 3000)."
  }
  if (res.status === 404) {
    return "API topilmadi — NEXT_PUBLIC_API_URL / Next.js rewrite portini tekshiring."
  }
  if (res.status === 401) {
    return "Noto‘g‘ri email yoki parol. Bazada foydalanuvchi bo‘lishi uchun: pnpm seed (API papkasida)."
  }
  if (res.status === 500) {
    return GENERIC_500_HINT;
  }
  return res.statusText || `So‘rov xatosi (${res.status})`;
}

export async function loginApi(identifier: string, password: string): Promise<LoginResponse> {
  const isEmail = identifier.includes('@');
  const body = isEmail
    ? { email: identifier, password }
    : { phone: identifier, password };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      msg.includes("fetch") || msg.includes("Network")
        ? "Serverga ulanib bo‘lmadi. NestJS API ishga tushirilganini tekshiring."
        : msg
    );
  }

  if (!res.ok) {
    const errMsg = await readApiErrorMessage(res);
    throw new Error(errMsg);
  }

  clearLegacyClientTokenStorage();
  return res.json();
}

/** Load current user; uses HttpOnly access cookie (no localStorage). */
export async function fetchMe(): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Sessiya yaroqsiz');
  }

  const raw = (await res.json()) as AuthUser | { user: AuthUser };
  const user =
    raw && typeof raw === "object" && "user" in raw && raw.user != null
      ? (raw as { user: AuthUser }).user
      : (raw as AuthUser);
  return { user };
}

export async function refreshTokenApi(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  refreshTtlMs?: number;
  accessTtlMs?: number;
}> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error('Token yangilanmadi');
  }

  clearLegacyClientTokenStorage();
  return res.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  }).catch(() => {});
  clearLegacyClientTokenStorage();
}

/**
 * Clears any pre-hardening tokens stored in JS-readable places.
 * Access/refresh/session cookies are cleared by the API on logout.
 */
export function clearLegacyClientTokenStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; path=/; max-age=0`;
  document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=; path=/; max-age=0`;
  document.cookie = `${TOKEN_KEYS.CSRF_TOKEN}=; path=/; max-age=0`;
}

/**
 * After login/refresh the API sets HttpOnly cookies; keep this as a no-op compat hook for callers.
 */
export function storeTokens(_accessFromBody?: string, _refreshFromBody?: string) {
  clearLegacyClientTokenStorage();
}

export function clearTokens() {
  clearLegacyClientTokenStorage();
}

/**
 * POST /auth/verify-password — sets short-lived HttpOnly `ruhiyat_step_up` for step-up–protected mutations.
 */
export async function verifyStepUpApi(password: string): Promise<{ ok: boolean }> {
  const csrf = await getCsrfHeadersForMutations();
  const res = await fetch(`${API_URL}/auth/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrf },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const msg = await readApiErrorMessage(res);
    throw new VerifyPasswordError(msg, res.status);
  }
  return res.json() as Promise<{ ok: boolean }>;
}
