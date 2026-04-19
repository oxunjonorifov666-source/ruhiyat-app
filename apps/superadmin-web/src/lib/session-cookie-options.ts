const isProd = process.env.NODE_ENV === 'production'

type CookieOpts = {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  path: string
  maxAge: number
}

export function accessCookieOptions(maxAgeSec: number): CookieOpts {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSec,
  }
}

export function refreshCookieOptions(maxAgeSec: number): CookieOpts {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSec,
  }
}
