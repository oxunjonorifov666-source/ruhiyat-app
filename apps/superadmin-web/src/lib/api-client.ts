import { clearLegacyBrowserTokens } from './auth'
import { saUrl } from './superadmin-base'
import { ApiHttpError } from './api-http-error'
import { getCsrfHeadersForMutations } from './api-csrf'

const rawUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`

export function browserApiBase(): string {
  if (typeof window === 'undefined') return API_URL
  if (!API_URL.startsWith('http')) return API_URL
  try {
    const u = new URL(API_URL)
    if (u.origin !== window.location.origin) return '/api'
  } catch {
    return '/api'
  }
  return API_URL
}

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined>
}

let refreshInflight: Promise<boolean> | null = null

function refreshSessionSingleFlight(): Promise<boolean> {
  if (!refreshInflight) {
    refreshInflight = (async () => {
      const res = await fetch(saUrl('/api/session/refresh'), {
        method: 'POST',
        credentials: 'include',
      })
      return res.ok
    })().finally(() => {
      refreshInflight = null
    })
  }
  return refreshInflight
}

export async function apiClient<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = browserApiBase()
  const url = base.startsWith('http')
    ? new URL(`${base}${path}`)
    : new URL(`${base}${path}`, window.location.origin)

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {}
  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json'
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    Object.assign(headers, await getCsrfHeadersForMutations())
  }

  const doFetch = () =>
    fetch(url.toString(), {
      method,
      headers,
      credentials: 'include',
      body: options.body !== undefined && options.body !== null ? JSON.stringify(options.body) : undefined,
    })

  let res = await doFetch()

  if (res.status === 401) {
    const refreshed = await refreshSessionSingleFlight()
    if (refreshed) {
      res = await doFetch()
    }
    if (res.status === 401) {
      clearLegacyBrowserTokens()
      window.location.href = saUrl('/login')
      throw new Error('Sessiya tugadi')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const raw =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: unknown }).message
        : undefined
    const message =
      typeof raw === 'string' && raw.trim() ? raw : `Xatolik: ${res.status}`
    throw new ApiHttpError(message, res.status, body)
  }

  return res.json() as Promise<T>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
