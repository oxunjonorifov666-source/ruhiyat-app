import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SA_COOKIE_ACCESS, SA_COOKIE_REFRESH } from '@/lib/session-constants'
import { upstreamApiUrl } from '@/lib/upstream-api'
import { accessCookieOptions, refreshCookieOptions } from '@/lib/session-cookie-options'

type LoginBody = { email?: string; password?: string }

export async function POST(request: Request) {
  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ success: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email va parol majburiy' }, { status: 400 })
  }

  const res = await fetch(upstreamApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const rawJson: unknown = await res.json().catch(() => ({}))
  const data = rawJson as {
    user?: { role?: string }
    accessToken?: string
    refreshToken?: string
    message?: string | string[]
  }

  if (!res.ok) {
    const msg = data.message
    const text = Array.isArray(msg) ? String(msg[0]) : typeof msg === 'string' ? msg : 'Kirish xatoligi'
    return NextResponse.json({ success: false, message: text || `Xatolik: ${res.status}` }, { status: res.status })
  }

  const user = data.user
  const accessToken = data.accessToken
  const refreshToken = data.refreshToken

  if (!accessToken || !refreshToken || !user) {
    return NextResponse.json({ success: false, message: 'Server javobi noto‘g‘ri' }, { status: 502 })
  }

  if (user.role !== 'SUPERADMIN') {
    return NextResponse.json({ success: false, message: 'Faqat superadmin kirishi mumkin' }, { status: 403 })
  }

  const jar = await cookies()
  jar.set(SA_COOKIE_ACCESS, accessToken, accessCookieOptions(15 * 60))
  jar.set(SA_COOKIE_REFRESH, refreshToken, refreshCookieOptions(7 * 24 * 60 * 60))

  return NextResponse.json({ success: true, user })
}
