import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TOKEN_KEYS } from '@ruhiyat/config'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname.includes('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    || request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*)', '/'],
}
