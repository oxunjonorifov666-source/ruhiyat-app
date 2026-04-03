import { TOKEN_KEYS } from '@ruhiyat/config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/admin/api';

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  administrator?: {
    id: number;
    centerId: number;
    position: string | null;
    center: { id: number; name: string };
  } | null;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function loginApi(identifier: string, password: string): Promise<LoginResponse> {
  const isEmail = identifier.includes('@');
  const body = isEmail
    ? { email: identifier, password }
    : { phone: identifier, password };

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Kirish xatoligi');
  }

  return res.json();
}

export async function fetchMe(accessToken: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Sessiya yaroqsiz');
  }

  return res.json();
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
