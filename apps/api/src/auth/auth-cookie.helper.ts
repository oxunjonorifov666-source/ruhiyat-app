import type { CookieOptions, Response } from 'express';

/** Must match `TOKEN_KEYS.REFRESH_TOKEN` in `@ruhiyat/config` (admin-web / clients). */
export const REFRESH_COOKIE_NAME = 'ruhiyat_refresh_token';

/** Must match `TOKEN_KEYS.ACCESS_TOKEN` — HttpOnly access JWT for browser clients. */
export const ACCESS_COOKIE_NAME = 'ruhiyat_access_token';

/** Must match `TOKEN_KEYS.STEP_UP_TOKEN` — short-lived proof after password re-check. */
export const STEP_UP_COOKIE_NAME = 'ruhiyat_step_up';

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  secure: boolean,
  domain?: string,
): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, Math.floor(maxAgeMs)),
  };
  if (domain) opts.domain = domain;
  res.cookie(REFRESH_COOKIE_NAME, token, opts);
}

export function clearRefreshTokenCookie(res: Response, secure: boolean, domain?: string): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  };
  if (domain) opts.domain = domain;
  res.cookie(REFRESH_COOKIE_NAME, '', opts);
}

export function readRefreshTokenFromRequest(req: { cookies?: Record<string, string>; body?: { refreshToken?: string } }): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const fromBody = req.body?.refreshToken;
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;
  if (typeof fromBody === 'string' && fromBody.length > 0) return fromBody;
  return undefined;
}

export function setAccessTokenCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  secure: boolean,
  domain?: string,
): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, Math.floor(maxAgeMs)),
  };
  if (domain) opts.domain = domain;
  res.cookie(ACCESS_COOKIE_NAME, token, opts);
}

export function clearAccessTokenCookie(res: Response, secure: boolean, domain?: string): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  };
  if (domain) opts.domain = domain;
  res.cookie(ACCESS_COOKIE_NAME, '', opts);
}

export function setStepUpCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  secure: boolean,
  domain?: string,
): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, Math.floor(maxAgeMs)),
  };
  if (domain) opts.domain = domain;
  res.cookie(STEP_UP_COOKIE_NAME, token, opts);
}

export function clearStepUpCookie(res: Response, secure: boolean, domain?: string): void {
  const opts: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  };
  if (domain) opts.domain = domain;
  res.cookie(STEP_UP_COOKIE_NAME, '', opts);
}
