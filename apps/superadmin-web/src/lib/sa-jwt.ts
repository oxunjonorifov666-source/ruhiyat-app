import { jwtVerify } from 'jose/jwt/verify'
import { getRequiredPermissionForPath } from '@/lib/superadmin-path-permissions'

const DEV_JWT_FALLBACK = 'ruhiyat-dev-secret-NOT-FOR-PRODUCTION'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/** Production must set JWT_SECRET (same signing key as API access tokens). */
function getAccessSecretBytes(): Uint8Array | null {
  const s = process.env.JWT_SECRET?.trim()
  if (s) return new TextEncoder().encode(s)
  if (IS_PRODUCTION) return null
  return new TextEncoder().encode(DEV_JWT_FALLBACK)
}

export type SaAccessPayload = {
  sub?: number
  role?: string
  pms?: string[]
}

export async function verifyAccessJwt(token: string): Promise<SaAccessPayload> {
  const key = getAccessSecretBytes()
  if (!key) {
    throw new Error('JWT_SECRET is required in production')
  }
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
  return payload as SaAccessPayload
}

export function hasRoutePermission(pathname: string, payload: SaAccessPayload): boolean {
  if (payload.role !== 'SUPERADMIN') return false
  const required = getRequiredPermissionForPath(pathname)
  if (!required) return true
  const pms = payload.pms ?? []
  if (pms.includes('*')) return true
  return pms.includes(required)
}
