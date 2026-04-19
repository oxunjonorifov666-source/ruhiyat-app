import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SA_COOKIE_ACCESS } from '@/lib/session-constants'

/**
 * Socket.io client JWT kerak qiladi. HttpOnly cookie brauzerda o‘qilmaydi —
 * qisqa muddatli token JSON orqali beriladi (XSS hujumiga qarshi CSP muhim).
 * Uzoq muddatli yechim: backend socket qo‘l bilan cookie asosida autentifikatsiya.
 */
export async function GET() {
  const jar = await cookies()
  const access = jar.get(SA_COOKIE_ACCESS)?.value
  
  const headers = new Headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  })

  if (!access) {
    return NextResponse.json(
      { success: false, message: 'Sessiya yo‘q' }, 
      { status: 401, headers }
    )
  }
  return NextResponse.json(
    { success: true, accessToken: access },
    { status: 200, headers }
  )
}
