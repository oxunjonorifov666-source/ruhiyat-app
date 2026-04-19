import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SA_COOKIE_ACCESS, SA_COOKIE_REFRESH } from '@/lib/session-constants'
import { hasRoutePermission, verifyAccessJwt } from '@/lib/sa-jwt'
import { SUPERADMIN_BASE } from '@/lib/superadmin-base'

const LOGIN_PATH = `${SUPERADMIN_BASE}/login`
const FORBIDDEN_PATH = `${SUPERADMIN_BASE}/forbidden`

function extractAccessFromSetCookie(setCookieHeaders: string[], cookieName: string): string | null {
  for (const line of setCookieHeaders) {
    const prefix = `${cookieName}=`
    if (!line.startsWith(prefix)) continue
    const rest = line.slice(prefix.length)
    const value = rest.split(';')[0]?.trim()
    if (value) return decodeURIComponent(value)
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Proksi qilinadigan API: cookie’dan Bearer qo‘shamiz (JS token saqlamaydi)
  if (pathname.startsWith('/api/')) {
    const access = request.cookies.get(SA_COOKIE_ACCESS)?.value
    const requestHeaders = new Headers(request.headers)
    if (access && !requestHeaders.get('authorization')) {
      requestHeaders.set('Authorization', `Bearer ${access}`)
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const isLogin = pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`
  const isForbidden = pathname === FORBIDDEN_PATH || pathname === `${FORBIDDEN_PATH}/`
  const isSessionApi = pathname.startsWith(`${SUPERADMIN_BASE}/api/session/`)

  if (isSessionApi || isForbidden) {
    return NextResponse.next()
  }

  if (isLogin) {
    const access = request.cookies.get(SA_COOKIE_ACCESS)?.value
    if (access) {
      try {
        await verifyAccessJwt(access)
        return NextResponse.redirect(new URL(`${SUPERADMIN_BASE}/dashboard`, request.url))
      } catch {
        /* login sahifasiga qoldiramiz */
      }
    }
    return NextResponse.next()
  }

  const isSuperadminArea = pathname === SUPERADMIN_BASE || pathname.startsWith(`${SUPERADMIN_BASE}/`)

  if (!isSuperadminArea) {
    return NextResponse.next()
  }

  const access = request.cookies.get(SA_COOKIE_ACCESS)?.value
  const refresh = request.cookies.get(SA_COOKIE_REFRESH)?.value

  let token = access

  const applyPermission = async (jwt: string) => {
    const payload = await verifyAccessJwt(jwt)
    if (!hasRoutePermission(pathname, payload)) {
      return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url))
    }
    return null
  }

  if (token) {
    try {
      const denied = await applyPermission(token)
      if (denied) return denied
      return NextResponse.next()
    } catch {
      token = undefined
    }
  }

  if (!token && refresh) {
    const refreshUrl = new URL(`${SUPERADMIN_BASE}/api/session/refresh`, request.url)
    const refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })

    if (!refreshRes.ok) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
    }

    const setCookies =
      typeof refreshRes.headers.getSetCookie === 'function'
        ? refreshRes.headers.getSetCookie()
        : [refreshRes.headers.get('set-cookie')].filter(Boolean) as string[]

    const newAccess = extractAccessFromSetCookie(setCookies, SA_COOKIE_ACCESS)
    const res = NextResponse.next()
    for (const c of setCookies) {
      if (c) res.headers.append('Set-Cookie', c)
    }

    if (newAccess) {
      try {
        const denied = await applyPermission(newAccess)
        if (denied) return denied
      } catch {
        return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
      }
    }
    return res
  }

  return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
