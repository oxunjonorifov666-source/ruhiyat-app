import { TOKEN_KEYS } from '@ruhiyat/config';

// Relativ `/api`: Next rewrites → NEXT_PUBLIC_API_URL (default next.config da API origin bilan mos)
const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const path = `${API_URL}/auth/login`;
  const url =
    typeof window !== "undefined" && !path.startsWith("http")
      ? new URL(path, window.location.origin).toString()
      : path;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    const hint =
      "Tarmoq xatosi: NestJS API ishlamayapti yoki noto‘g‘ri port. " +
      "Terminalda `Asset-Linker/apps/api` ichida `pnpm dev` ni ishga tushiring (`.env` dagi PORT, odatda 3001). " +
      "Keyin superadmin (`pnpm dev`, port 18344) ni qayta tekshiring.";
    throw new Error(hint);
  }

  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    if (!ct.includes("application/json")) {
      const snippet = await res.text().then((t) => t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)).catch(() => "");
      throw new Error(
        `API ${res.status} (JSON emas — odatda Next → Nest proksi yoki API ishlamayapti). ` +
          `1) Alohida terminalda: pnpm api:dev (PORT=3001). 2) Brauzerda tekshiring: http://127.0.0.1:3001/api/healthz ` +
          `3) Superadminni qayta ishga tushiring. ` +
          (snippet ? ` (${snippet}…)` : ""),
      );
    }
    const error = await res.json().catch(() => ({}));
    const msg = error.message;
    const text = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : null;
    throw new Error(text || 'Kirish xatoligi');
  }

  return res.json();
}

export async function fetchMe(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Sessiya yaroqsiz');
  }

  const data = await res.json();
  return {
    id: data.id ?? data.user?.id,
    email: data.email ?? data.user?.email ?? null,
    phone: data.phone ?? data.user?.phone ?? null,
    firstName: data.firstName ?? data.user?.firstName ?? null,
    lastName: data.lastName ?? data.user?.lastName ?? null,
    role: data.role ?? data.user?.role,
    permissions: data.permissions ?? data.user?.permissions ?? [],
  };
}

export async function refreshTokenApi(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Token yangilanmadi');
  }

  return res.json();
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
  document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; path=/; max-age=0`;
  document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=; path=/; max-age=0`;
}
