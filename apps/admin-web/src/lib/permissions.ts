import { type AuthUser } from './auth';

export type Action = 'view' | 'create' | 'update' | 'delete' | 'manage' | 'view-sensitive';

export type Resource = 
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'psychologists'
  | 'staff'
  | 'courses'
  | 'groups'
  | 'payments'
  | 'reports'
  | 'statistics'
  | 'revenue'
  | 'transactions'
  | 'tests'
  | 'results'
  | 'chat'
  | 'notifications'
  | 'meetings'
  | 'sessions'
  | 'announcements'
  | 'settings'
  | 'roles'
  | 'security'
  | 'audit-logs'
  | 'integrations';

export type Permission = `${Action}:${Resource}`;

/**
 * Checks if a user has the required permission capabilities.
 * It prioritizes explicit explicit permissions array if available, 
 * then gracefully falls back to basic role-based heuristics in a strict manner.
 */
export function hasPermission(user: AuthUser | null, required: Permission | Permission[]): boolean {
  if (!user) return false;
  
  // Superadmins typically override all restrictions if we wanted to handle mixed mode,
  // but this dashboard expects 'ADMINISTRATOR' for Center Admins.
  if (user.role === 'SUPERADMIN') return true;
  
  const requiredArray = Array.isArray(required) ? required : [required];
  if (requiredArray.length === 0) return true;

  /** Matches Nest SystemController / SecurityController — not valid for center administrators. */
  const superadminOnlyResources: Resource[] = ['security', 'audit-logs', 'integrations'];
  if (
    user.role === 'ADMINISTRATOR' &&
    requiredArray.some((req) => {
      const [, resource] = req.split(':') as [Action, Resource];
      return superadminOnlyResources.includes(resource);
    })
  ) {
    return false;
  }

  // 1. If explicit permissions exist from the backend, use those as absolute truth
  if (user.permissions && Array.isArray(user.permissions)) {
    return requiredArray.every(req => user.permissions!.includes(req));
  }

  // 2. Fallback: Role-based coarse-grained mapping
  // Since 'ADMINISTRATOR' rules center scope, we consider they own typical capabilities
  // Except potentially some deeply restricted ones like system security adjustments.
  if (user.role === 'ADMINISTRATOR') {
    return requiredArray.every(req => {
      const [action, resource] = req.split(':') as [Action, Resource];
      
      // Administrators can usually view most things
      if (action === 'view') return true;

      // Restrict critical or destructive destructive actions by default as a safety heuristic
      if (action === 'delete') {
        const restrictedDeletables: Resource[] = ['audit-logs', 'payments', 'transactions', 'settings', 'roles'];
        if (restrictedDeletables.includes(resource)) return false;
      }
      
      if (action === 'manage') {
        const restrictedManageables: Resource[] = ['security', 'audit-logs'];
        if (restrictedManageables.includes(resource)) return false;
      }

      // Default permissive for standard center operations since they are the center admin
      return true;
    });
  }

  // General users (students, teachers, etc.) shouldn't be here, but if they are:
  return false;
}
