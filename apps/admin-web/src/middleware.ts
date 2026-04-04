import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TOKEN_KEYS } from '@ruhiyat/config'

function noCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname.includes('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  if (isPublicRoute) {
    return noCacheHeaders(NextResponse.next())
  }

  const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    || request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirect = NextResponse.redirect(url)
    return noCacheHeaders(redirect)
  }

  return noCacheHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/(.*)', '/'],
}
