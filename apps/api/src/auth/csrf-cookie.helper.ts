import { randomBytes, timingSafeEqual } from 'crypto';
import type { CookieOptions, Response } from 'express';
import type { Request } from 'express';

/** Must match `TOKEN_KEYS.CSRF_TOKEN` in `@ruhiyat/config`. */
export const CSRF_COOKIE_NAME = 'ruhiyat_csrf_token';

/** Header the browser sends; must match the non-HttpOnly CSRF cookie (double-submit). */
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function setCsrfCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  secure: boolean,
  domain?: string,
): void {
  const opts: CookieOptions = {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, Math.floor(maxAgeMs)),
  };
  if (domain) opts.domain = domain;
  res.cookie(CSRF_COOKIE_NAME, token, opts);
}

export function clearCsrfCookie(res: Response, secure: boolean, domain?: string): void {
  const opts: CookieOptions = {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  };
  if (domain) opts.domain = domain;
  res.cookie(CSRF_COOKIE_NAME, '', opts);
}

export function readCsrfTokenFromCookie(req: Request): string | undefined {
  const c = req.cookies?.[CSRF_COOKIE_NAME];
  return typeof c === 'string' && c.length > 0 ? c : undefined;
}

function readCsrfTokenFromHeader(req: Request): string | undefined {
  const raw = req.headers[CSRF_HEADER_NAME];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === 'string' && v.length > 0 ? v.trim() : undefined;
}

/** Constant-time equality for double-submit verification. */
export function csrfTokensMatch(req: Request): boolean {
  const cookie = readCsrfTokenFromCookie(req);
  const header = readCsrfTokenFromHeader(req);
  if (!cookie || !header) return false;
  if (cookie.length !== header.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookie, 'utf8'), Buffer.from(header, 'utf8'));
  } catch {
    return false;
  }
}
