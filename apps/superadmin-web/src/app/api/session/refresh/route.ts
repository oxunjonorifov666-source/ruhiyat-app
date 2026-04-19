import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SA_COOKIE_ACCESS, SA_COOKIE_REFRESH } from '@/lib/session-constants'
import { upstreamApiUrl } from '@/lib/upstream-api'
import { accessCookieOptions, refreshCookieOptions } from '@/lib/session-cookie-options'

export async function POST() {
  const jar = await cookies()
  const refresh = jar.get(SA_COOKIE_REFRESH)?.value
  if (!refresh) {
    return NextResponse.json({ success: false, message: 'Sessiya yo‘q' }, { status: 401 })
  }

  const res = await fetch(upstreamApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  })

  const rawJson: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    jar.set(SA_COOKIE_ACCESS, '', { httpOnly: true, path: '/', maxAge: 0 })
    jar.set(SA_COOKIE_REFRESH, '', { httpOnly: true, path: '/', maxAge: 0 })
    return NextResponse.json({ success: false, message: 'Token yangilanmadi' }, { status: 401 })
  }

  const data = rawJson as { accessToken?: string; refreshToken?: string; data?: { accessToken?: string; refreshToken?: string } }
  const accessToken = data.accessToken ?? data.data?.accessToken
  const newRefresh = data.refreshToken ?? data.data?.refreshToken

  if (!accessToken || !newRefresh) {
    return NextResponse.json({ success: false, message: 'Javob noto‘g‘ri' }, { status: 502 })
  }

  jar.set(SA_COOKIE_ACCESS, accessToken, accessCookieOptions(15 * 60))
  jar.set(SA_COOKIE_REFRESH, newRefresh, refreshCookieOptions(7 * 24 * 60 * 60))

  return NextResponse.json({ success: true })
}
