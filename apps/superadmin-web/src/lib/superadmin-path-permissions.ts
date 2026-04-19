import { SUPERADMIN_BASE } from '@/lib/superadmin-base'

function normalizePathname(pathname: string): string {
  if (pathname.startsWith(`${SUPERADMIN_BASE}/`) || pathname === SUPERADMIN_BASE) {
    return pathname
  }
  if (pathname.startsWith('/')) {
    return `${SUPERADMIN_BASE}${pathname}`
  }
  return `${SUPERADMIN_BASE}/${pathname}`
}

/**
 * Sahifa yo‘li uchun talab qilinadigan ruxsat (JWT `pms` ichida).
 * null — faqat autentifikatsiya (cookie) kifoya.
 * `usePathname()` ba’zan `basePath`siz qaytaradi — ikkala holat ham qo‘llab-quvvatlanadi.
 */
export function getRequiredPermissionForPath(pathname: string): string | null {
  const path = normalizePathname(pathname)
  const rules: { prefix: string; permission: string }[] = [
    { prefix: '/superadmin/users', permission: 'users.read' },
    { prefix: '/superadmin/psychologists', permission: 'psychologists.read' },
    { prefix: '/superadmin/administrators', permission: 'users.read' },
    { prefix: '/superadmin/roles', permission: 'system.settings' },
    { prefix: '/superadmin/access-control', permission: 'system.settings' },
    { prefix: '/superadmin/chat', permission: 'communication.read' },
    { prefix: '/superadmin/videochat', permission: 'communication.read' },
    { prefix: '/superadmin/community', permission: 'community.read' },
    { prefix: '/superadmin/reviews', permission: 'community.read' },
    { prefix: '/superadmin/announcements', permission: 'communication.write' },
    { prefix: '/superadmin/articles', permission: 'content.read' },
    { prefix: '/superadmin/banners', permission: 'content.write' },
    { prefix: '/superadmin/notifications', permission: 'communication.read' },
    { prefix: '/superadmin/audio', permission: 'content.read' },
    { prefix: '/superadmin/videos', permission: 'content.read' },
    { prefix: '/superadmin/affirmations', permission: 'content.write' },
    { prefix: '/superadmin/projective-methods', permission: 'content.write' },
    { prefix: '/superadmin/tests', permission: 'assessments.read' },
    { prefix: '/superadmin/trainings', permission: 'content.read' },
    { prefix: '/superadmin/ai-dilosh', permission: 'system.settings' },
    { prefix: '/superadmin/sessions', permission: 'sessions.read' },
    { prefix: '/superadmin/meetings', permission: 'meetings.read' },
    { prefix: '/superadmin/sessions-history', permission: 'meetings.read' },
    { prefix: '/superadmin/activity-logs', permission: 'system.audit' },
    { prefix: '/superadmin/complaints', permission: 'community.moderate' },
    { prefix: '/superadmin/reports-moderation', permission: 'community.moderate' },
    { prefix: '/superadmin/blocking', permission: 'community.moderate' },
    { prefix: '/superadmin/content-control', permission: 'community.moderate' },
    { prefix: '/superadmin/moderation', permission: 'community.moderate' },
    { prefix: '/superadmin/payments', permission: 'finance.read' },
    { prefix: '/superadmin/revenue', permission: 'finance.read' },
    { prefix: '/superadmin/transactions', permission: 'finance.read' },
    { prefix: '/superadmin/finance-statistics', permission: 'finance.read' },
    { prefix: '/superadmin/monetization', permission: 'system.settings' },
    { prefix: '/superadmin/settings', permission: 'system.settings' },
    { prefix: '/superadmin/app-settings', permission: 'system.settings' },
    { prefix: '/superadmin/legal-compliance', permission: 'system.settings' },
    { prefix: '/superadmin/security', permission: 'system.settings' },
    { prefix: '/superadmin/audit-logs', permission: 'system.audit' },
    { prefix: '/superadmin/integrations', permission: 'system.settings' },
    { prefix: '/superadmin/monitoring', permission: 'system.settings' },
    { prefix: '/superadmin/system-access', permission: 'system.settings' },
    { prefix: '/superadmin/mobile-settings', permission: 'system.settings' },
  ]

  for (const r of rules) {
    if (path === r.prefix || path.startsWith(`${r.prefix}/`)) {
      return r.permission
    }
  }
  return null
}
