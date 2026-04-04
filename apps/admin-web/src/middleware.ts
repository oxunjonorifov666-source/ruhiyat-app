import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TOKEN_KEYS } from '@ruhiyat/config'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/login') {
    const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  const token = request.cookies.get(TOKEN_KEYS.ACCESS_TOKEN)?.value
    || request.cookies.get(TOKEN_KEYS.REFRESH_TOKEN)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api).*)',
  ],
}
