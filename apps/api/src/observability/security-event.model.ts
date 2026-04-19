/**
 * Alert-ready security telemetry model for log aggregators (Loki, Datadog, SIEM).
 * All `event_name` values are stable — do not rename without a migration note.
 */

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventCategory =
  | 'auth'
  | 'tenant'
  | 'privilege'
  | 'anomaly'
  | 'destructive_action'
  | 'csrf'
  | 'session';

export type SecurityEventResult = 'success' | 'failure' | 'blocked';

/** Stable event identifiers (use in dashboards / alert rules). */
export const SECURITY_EVENT_NAME = {
  HTTP_UNAUTHORIZED: 'ruhiyat.security.http.unauthorized',
  HTTP_FORBIDDEN: 'ruhiyat.security.http.forbidden',
  HTTP_AUTH_BURST: 'ruhiyat.security.anomaly.http_auth_burst',

  AUTH_LOGIN_FAILED: 'ruhiyat.security.auth.login_failed',
  AUTH_LOGIN_SUCCESS: 'ruhiyat.security.auth.login_success',
  AUTH_REGISTER_SUCCESS: 'ruhiyat.security.auth.register_success',

  AUTH_STEP_UP_FAILED: 'ruhiyat.security.auth.step_up_failed',
  AUTH_STEP_UP_SUCCESS: 'ruhiyat.security.auth.step_up_success',

  SESSION_BINDING_MISMATCH: 'ruhiyat.security.session.binding_mismatch',
  SESSION_REFRESH_FAILED: 'ruhiyat.security.session.refresh_failed',

  PRIVILEGE_SECURITY_POLICY_CHANGE: 'ruhiyat.security.privilege.security_policy_change',
  PRIVILEGE_SESSION_TERMINATION: 'ruhiyat.security.privilege.session_termination',
  PRIVILEGE_SESSIONS_LOGOUT_ALL: 'ruhiyat.security.privilege.sessions_logout_all',

  CSRF_VALIDATION_FAILED: 'ruhiyat.security.csrf.validation_failed',
  CSRF_BURST: 'ruhiyat.security.anomaly.csrf_burst',

  TENANT_SCOPE_VIOLATION: 'ruhiyat.security.tenant.scope_violation',

  PRIVILEGE_DENIED: 'ruhiyat.security.privilege.denied',

  SUPERADMIN_SETTING_CHANGE: 'ruhiyat.security.privilege.superadmin_setting_change',
  SUPERADMIN_MOBILE_SETTING_CHANGE: 'ruhiyat.security.privilege.superadmin_mobile_setting_change',

  DESTRUCTIVE_RAPID_BURST: 'ruhiyat.security.anomaly.destructive_rapid_burst',

  ANOMALY_THRESHOLD_EXCEEDED: 'ruhiyat.security.anomaly.threshold_exceeded',

  LEGACY: 'ruhiyat.security.legacy',
} as const;

export type SecurityEventPayload = {
  event_name: string;
  severity: SecurityEventSeverity;
  category: SecurityEventCategory;
  /** When true, recommended for paging / high-priority alert routes. */
  alert?: boolean;
  result?: SecurityEventResult;
  actor_user_id?: number | null;
  actor_role?: string | null;
  route?: string;
  /** Optional stable key for grouping in Loki/Datadog (e.g. `403:42:/api/users`). */
  aggregation_key?: string;
  target?: Record<string, unknown>;
  details?: Record<string, unknown>;
};
