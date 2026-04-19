import { TOKEN_KEYS } from '@ruhiyat/config'
import { LEGACY_TOKEN_KEYS } from '@/lib/session-constants'
import { getCsrfHeadersForMutations } from '@/lib/api-csrf'
import { VerifyPasswordError } from '@/lib/verify-password-error'
import { saUrl } from '@/lib/superadmin-base'

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`

export interface AuthUser {
  id: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: string
  permissions: string[]
}

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: Number(raw.id),
    email: (raw.email as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    firstName: (raw.firstName as string | null) ?? null,
    lastName: (raw.lastName as string | null) ?? null,
    role: String(raw.role),
    permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [],
  }
}

/** Eski localStorage / ochiq cookie tokenlarini tozalaydi (transitional) */
export function clearLegacyBrowserTokens() {
  if (typeof window === 'undefined') return
  for (const k of LEGACY_TOKEN_KEYS) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN)
  } catch {
    /* ignore */
  }
  const past = 'Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; path=/; expires=${past}; SameSite=Lax`
  document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=; path=/; expires=${past}; SameSite=Lax`
}

export async function sessionLogin(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await fetch(saUrl('/api/session/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; user?: Record<string, unknown>; message?: string }
  if (!res.ok) {
    throw new Error(data.message || 'Kirish xatoligi')
  }
  if (!data.user) {
    throw new Error('Server javobi noto‘g‘ri')
  }
  clearLegacyBrowserTokens()
  return { user: normalizeUser(data.user) }
}

export async function sessionMe(): Promise<AuthUser> {
  const res = await fetch(saUrl('/api/session/me'), { credentials: 'include', cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as { user?: Record<string, unknown>; message?: string }
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Sessiya yaroqsiz')
  }
  if (!data.user) {
    throw new Error('Sessiya yaroqsiz')
  }
  return normalizeUser(data.user)
}

export async function sessionLogout(): Promise<void> {
  await fetch(saUrl('/api/session/logout'), { method: 'POST', credentials: 'include' }).catch(() => undefined)
  clearLegacyBrowserTokens()
}

export async function sessionRefresh(): Promise<boolean> {
  const res = await fetch(saUrl('/api/session/refresh'), { method: 'POST', credentials: 'include' })
  return res.ok
}

/** Socket.io uchun qisqa muddatli token (CSP bilan himoyalangan transitional yo‘l) */
export async function fetchSocketAccessToken(): Promise<string | null> {
  const res = await fetch(saUrl('/api/session/socket-token'), { credentials: 'include', cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as { accessToken?: string }
  if (!res.ok || !data.accessToken) return null
  return data.accessToken
}

/**
 * @deprecated Tokenlar HttpOnly cookie’da; bu har doim `null` qaytaradi.
 * Eski importlarni bosqichma-bosqich olib tashlang.
 */
export function getStoredTokens(): null {
  return null
}

/** @deprecated — sessiya cookie orqali boshqariladi */
export function storeTokens(_accessToken: string, _refreshToken: string) {
  clearLegacyBrowserTokens()
}

export function clearTokens() {
  clearLegacyBrowserTokens()
}

/** Sets short-lived HttpOnly `ruhiyat_step_up` for StepUpGuard-protected API routes. */
export async function verifyStepUpApi(password: string): Promise<{ ok: boolean }> {
  if (typeof window === 'undefined') {
    throw new Error('verifyStepUpApi: client only')
  }
  const url = new URL('/api/auth/verify-password', window.location.origin).toString()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, await getCsrfHeadersForMutations())
  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ password }),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    throw new VerifyPasswordError(
      typeof data.message === 'string' && data.message ? data.message : "Parol noto'g'ri",
    )
  }
  return { ok: true }
}
