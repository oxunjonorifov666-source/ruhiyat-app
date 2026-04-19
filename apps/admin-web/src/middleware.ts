import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { TOKEN_KEYS } from "@ruhiyat/config"
import { isSuperadminOnlyPathname } from "@/lib/superadmin-only-routes"
import {
  ADMIN_WEB_PANEL_ROLES,
  clearAuthCookies,
  verifyAdminTokensFromCookies,
} from "@/lib/verify-admin-jwt"

function noCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname.includes("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"

  if (isPublicRoute) {
    return noCacheHeaders(NextResponse.next())
  }

  const hasAnyToken =
    Boolean(request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value) ||
    Boolean(request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value)

  if (!hasAnyToken) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirect = NextResponse.redirect(url)
    return noCacheHeaders(redirect)
  }

  const payload = await verifyAdminTokensFromCookies(request)

  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirect = NextResponse.redirect(url)
    clearAuthCookies(redirect)
    return noCacheHeaders(redirect)
  }

  if (!ADMIN_WEB_PANEL_ROLES.has(payload.role)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("reason", "panel")
    const redirect = NextResponse.redirect(url)
    clearAuthCookies(redirect)
    return noCacheHeaders(redirect)
  }

  if (isSuperadminOnlyPathname(pathname) && payload.role !== "SUPERADMIN") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    const redirect = NextResponse.redirect(url)
    return noCacheHeaders(redirect)
  }

  return noCacheHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
