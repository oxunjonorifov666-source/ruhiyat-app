/**
 * Server-only: NestJS API bazaviy URL (`.../api` bilan).
 */
export function getUpstreamApiOrigin(): string {
  const raw = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'
  let u = raw.trim().replace(/\/+$/, '')
  if (u.endsWith('/api')) u = u.slice(0, -4)
  return u
}

export function upstreamApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${getUpstreamApiOrigin()}/api${p}`
}
