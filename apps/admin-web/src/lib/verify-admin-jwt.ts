import { jwtVerify } from "jose"
import { TOKEN_KEYS } from "@ruhiyat/config"
import type { NextRequest } from "next/server"
import type { NextResponse } from "next/server"

/** Dev-only; production must set JWT_SECRET (align with API `assertProductionJwtSecretPresent`). */
const JWT_SECRET_FALLBACK = "ruhiyat-dev-secret-NOT-FOR-PRODUCTION"
/** Dev-only; production must set JWT_REFRESH_SECRET. */
const JWT_REFRESH_SECRET_FALLBACK = "ruhiyat-refresh-dev-secret-NOT-FOR-PRODUCTION"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

function resolveAccessSecret(): string | null {
  const s = process.env.JWT_SECRET?.trim()
  if (s) return s
  if (IS_PRODUCTION) return null
  return JWT_SECRET_FALLBACK
}

function resolveRefreshSecret(): string | null {
  const s = process.env.JWT_REFRESH_SECRET?.trim()
  if (s) return s
  if (IS_PRODUCTION) return null
  return JWT_REFRESH_SECRET_FALLBACK
}

export type AdminJwtPayload = {
  sub: number
  role: string
  cid?: number | null
  pms?: string[]
}

function parsePayload(raw: unknown): AdminJwtPayload | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const sub = p.sub
  const role = p.role
  if (typeof role !== "string") return null
  const subNum = typeof sub === "number" ? sub : typeof sub === "string" ? parseInt(sub, 10) : NaN
  if (!Number.isFinite(subNum)) return null
  let cid: number | null = null
  if (p.cid !== undefined && p.cid !== null) {
    const c = typeof p.cid === "number" ? p.cid : parseInt(String(p.cid), 10)
    cid = Number.isFinite(c) ? c : null
  } else if (p.cid === null) {
    cid = null
  }
  const pms = Array.isArray(p.pms) ? p.pms.filter((x): x is string => typeof x === "string") : []
  return { sub: subNum, role, cid, pms }
}

/**
 * Verifies access token (HS256, JWT_SECRET), then refresh (JWT_REFRESH_SECRET).
 * Signature verification — do not use unsigned decode for authorization.
 */
export async function verifyAdminTokensFromCookies(request: NextRequest): Promise<AdminJwtPayload | null> {
  const access = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
  const refresh = request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value

  if (access) {
    const accessSecret = resolveAccessSecret()
    if (!accessSecret) return null
    try {
      const { payload } = await jwtVerify(access, new TextEncoder().encode(accessSecret), {
        algorithms: ["HS256"],
      })
      return parsePayload(payload)
    } catch {
      /* try refresh */
    }
  }

  if (refresh) {
    const refreshSecret = resolveRefreshSecret()
    if (!refreshSecret) return null
    try {
      const { payload } = await jwtVerify(refresh, new TextEncoder().encode(refreshSecret), {
        algorithms: ["HS256"],
      })
      return parsePayload(payload)
    } catch {
      return null
    }
  }

  return null
}

/** Roles allowed to use the admin-web shell at all. */
export const ADMIN_WEB_PANEL_ROLES = new Set(["ADMINISTRATOR", "SUPERADMIN"])

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(TOKEN_KEYS.ACCESS_TOKEN)
  response.cookies.delete(TOKEN_KEYS.REFRESH_TOKEN)
}
