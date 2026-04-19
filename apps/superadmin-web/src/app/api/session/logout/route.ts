import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SA_COOKIE_ACCESS, SA_COOKIE_REFRESH } from '@/lib/session-constants'
import { upstreamApiUrl } from '@/lib/upstream-api'
import { accessCookieOptions, refreshCookieOptions } from '@/lib/session-cookie-options'

export async function POST() {
  const jar = await cookies()
  const refresh = jar.get(SA_COOKIE_REFRESH)?.value

  if (refresh) {
    await fetch(upstreamApiUrl('/auth/logout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => undefined)
  }

  jar.set(SA_COOKIE_ACCESS, '', { ...accessCookieOptions(0), maxAge: 0, expires: new Date(0) })
  jar.set(SA_COOKIE_REFRESH, '', { ...refreshCookieOptions(0), maxAge: 0, expires: new Date(0) })

  return NextResponse.json({ success: true })
}
