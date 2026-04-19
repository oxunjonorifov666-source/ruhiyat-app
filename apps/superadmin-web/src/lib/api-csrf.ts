import { TOKEN_KEYS } from '@ruhiyat/config'

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

/**
 * Double-submit CSRF for cookie sessions (mutating requests with access cookie).
 * Bootstraps via GET /auth/csrf if the CSRF cookie is missing.
 */
export async function getCsrfHeadersForMutations(): Promise<Record<string, string>> {
  let token = readBrowserCookie(TOKEN_KEYS.CSRF_TOKEN)
  if (!token) {
    const url =
      typeof window !== 'undefined'
        ? new URL('/api/auth/csrf', window.location.origin).toString()
        : API_URL.startsWith('http')
          ? `${API_URL}/auth/csrf`
          : `http://localhost`
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' })
      if (res.ok) token = readBrowserCookie(TOKEN_KEYS.CSRF_TOKEN)
    } catch {
      /* ignore */
    }
  }
  return token ? { 'X-CSRF-Token': token } : {}
}
