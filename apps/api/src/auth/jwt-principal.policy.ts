/**
 * JWT principal policy — tenant safety and claim freshness
 *
 * ## Trusted from the signed JWT (after signature + expiry checks)
 * - `sub` — user id. This is the only claim used to load the request principal.
 *
 * ## Not trusted from JWT payload for authorization (may be stale until token rotates)
 * - `role`, `cid` (center id), `pms` (permissions)
 *
 * These are still embedded in access/refresh tokens for backward compatibility and client
 * hints, but {@link AuthService.resolvePrincipalForJwt} replaces them on every request with
 * database-resolved values before `request.user` is attached.
 *
 * ## Source of truth for tenant-critical checks
 * - Role, active status, tenant `centerId`: `User` + `Administrator` (authoritative) and
 *   `Psychologist` (when no admin row) — see {@link resolvePrincipalCenterId} in `tenant-scope.util`
 * - Permission strings: {@link AuthService.getUserPermissions} (DB-backed)
 *
 * ## Token refresh
 * Login and refresh already call {@link AuthService.getAuthUserContext} before signing new
 * tokens, so newly issued tokens align with current DB state; short-lived access tokens plus
 * per-request principal resolution limit stale-claim windows.
 *
 * ## Non-HTTP auth (e.g. WebSocket)
 * Socket handlers that verify JWT manually should load `role` / tenant fields from the DB for
 * the same reasons (see chat gateway connection path).
 */

export const JWT_TRUSTED_CLAIMS = ['sub'] as const;
