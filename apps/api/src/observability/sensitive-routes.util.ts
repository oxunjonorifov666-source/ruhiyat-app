/**
 * Heuristic: API path prefixes with elevated or cross-tenant security impact.
 * Used for 403 threat signals and selective PERMISSION_DENIED persistence.
 */
export function isSensitiveApiPath(path: string): boolean {
  const p = String(path || '')
    .split('?')[0]
    .replace(/^\/api\/?/, '/api/');
  return /\/api\/(blocks|roles|security|users|system|meetings|administrators|education-centers|courses|groups|enrollments|legal)\b/i.test(
    p,
  );
}
