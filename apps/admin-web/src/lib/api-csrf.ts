import { TOKEN_KEYS } from '@ruhiyat/config';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Headers for mutating requests when using cookie-based sessions.
 * Bootstraps CSRF via GET /auth/csrf if the double-submit cookie is missing.
 */
export async function getCsrfHeadersForMutations(): Promise<Record<string, string>> {
  let token = readBrowserCookie(TOKEN_KEYS.CSRF_TOKEN);
  if (!token) {
    try {
      const res = await fetch(`${API_URL}/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) token = readBrowserCookie(TOKEN_KEYS.CSRF_TOKEN);
    } catch {
      /* ignore */
    }
  }
  return token ? { 'X-CSRF-Token': token } : {};
}
