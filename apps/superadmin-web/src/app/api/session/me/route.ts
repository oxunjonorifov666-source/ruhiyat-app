import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SA_COOKIE_ACCESS } from '@/lib/session-constants'
import { upstreamApiUrl } from '@/lib/upstream-api'

export async function GET() {
  const jar = await cookies()
  const access = jar.get(SA_COOKIE_ACCESS)?.value
  if (!access) {
    return NextResponse.json({ success: false, message: 'Sessiya yo‘q' }, { status: 401 })
  }

  const res = await fetch(upstreamApiUrl('/auth/me'), {
    headers: { Authorization: `Bearer ${access}` },
    cache: 'no-store',
  })

  const rawJson: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    return NextResponse.json(
      { success: false, message: typeof (rawJson as { message?: string })?.message === 'string' ? (rawJson as { message: string }).message : 'Sessiya yaroqsiz' },
      { status: res.status },
    )
  }

  const data = rawJson as Record<string, unknown>
  const user =
    data.user && typeof data.user === 'object'
      ? data.user
      : {
          id: data.id,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          permissions: data.permissions ?? [],
        }

  return NextResponse.json({ success: true, user })
}
