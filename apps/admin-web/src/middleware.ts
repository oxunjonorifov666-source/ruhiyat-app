import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TOKEN_KEYS } from '@ruhiyat/config'

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === '/_next' || pathname.startsWith('/_next/') ||
    pathname === '/api' || pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isLoginPage = pathname === '/login' || pathname === '/login/'

  if (isLoginPage) {
    const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    if (token) {
      return redirectTo(request, '/dashboard')
    }
    return NextResponse.next()
  }

  const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    || request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value

  if (!token) {
    return redirectTo(request, '/login')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*)', '/'],
}
