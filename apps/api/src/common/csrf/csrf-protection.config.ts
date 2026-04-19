/**
 * Browser CSRF protection (double-submit cookie) for cookie-based sessions.
 *
 * ## Strategy
 * When the HttpOnly access cookie (`ruhiyat_access_token`) is present on a mutating request,
 * the server requires a matching non-HttpOnly CSRF cookie and `X-CSRF-Token` header.
 * API clients using `Authorization: Bearer` only (no access cookie) are not subject to this check.
 *
 * ## Protected (subject to enforcement when access cookie is sent)
 * All `POST`, `PATCH`, `PUT`, `DELETE` requests whose Express path starts with `/api/`,
 * except exact/prefix exclusions below. Examples of protected areas (non-exhaustive):
 * `/api/users`, `/api/roles`, `/api/security`, `/api/education-centers`, `/api/courses`,
 * `/api/legal`, `/api/blocks`, `/api/auth/me`-adjacent mutating routes, `/api/payments`, etc.
 * `GET`, `HEAD`, `OPTIONS` are never CSRF-checked here.
 *
 * ## Exclusions (no CSRF check on these paths)
 * - Session bootstrap and public auth flows that must work before a CSRF cookie exists or
 *   without extra headers (refresh uses refresh cookie; SameSite=Lax still applies).
 * - Third-party server callbacks that do not carry our browser session cookies.
 *
 * See `csrf.middleware.ts` for the canonical matcher implementation.
 */

/** Exact path matches after Express `req.path` normalization (includes `/api` prefix). */
export const CSRF_EXCLUDED_EXACT_PATHS: readonly string[] = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  /** Logout uses refresh cookie; kept compatible without requiring CSRF bootstrap. */
  '/api/auth/logout',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/auth/password/reset-request',
  '/api/auth/password/reset-verify',
  '/api/auth/password/reset',
  /** CLICK Shop server-to-server; no browser access cookie in practice. */
  '/api/integrations/click/shop',
];

/** Prefix matches: path equals prefix or starts with `prefix + '/'`. */
export const CSRF_EXCLUDED_PATH_PREFIXES: readonly string[] = ['/api/healthz'];
