/**
 * URL prefixes that must only be reachable by SUPERADMIN (must stay in sync with middleware).
 * Nav filtering uses the same paths as exact hrefs.
 */
export const SUPERADMIN_ONLY_ROUTE_PREFIXES = [
  "/security",
  "/audit-logs",
  "/blocking",
  "/staff-roles",
  "/integrations",
  "/legal-compliance",
] as const

export function isSuperadminOnlyPathname(pathname: string): boolean {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`
  return SUPERADMIN_ONLY_ROUTE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  )
}

/** Exact nav hrefs used for filtering sidebar items for administrators. */
export const SUPERADMIN_ONLY_HREFS = new Set<string>(SUPERADMIN_ONLY_ROUTE_PREFIXES)
