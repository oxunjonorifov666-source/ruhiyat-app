/**
 * Normalized threat-detection signal IDs for SIEM / Loki / Datadog alert rules.
 * Emitted when in-process thresholds indicate suspicious patterns (bursts, probes).
 */

export type ThreatSignalId =
  | 'AUTH_BRUTE_FORCE_SUSPECTED'
  | 'STEP_UP_ABUSE_SUSPECTED'
  | 'TENANT_PROBE_SUSPECTED'
  | 'PRIVILEGE_ABUSE_SUSPECTED'
  | 'SUPERADMIN_ANOMALY_SUSPECTED'
  | 'CSRF_ABUSE_SUSPECTED'
  | 'SESSION_BINDING_ABUSE_SUSPECTED'
  | 'DESTRUCTIVE_BURST_SUSPECTED'
  | 'API_CREDENTIAL_PROBE_SUSPECTED';

/** Stable full event_name for logs (query: `event_name:"ruhiyat.threat.*"`) */
export function threatEventName(id: ThreatSignalId): string {
  return `ruhiyat.threat.${id}`;
}

export type AnomalyKind =
  | 'failed_login_burst'
  | 'step_up_failure_burst'
  | 'csrf_failure_burst'
  | 'tenant_scope_violation_burst'
  | 'session_binding_mismatch_burst'
  | 'superadmin_mutation_burst'
  | 'http_auth_error_burst'
  | 'sensitive_route_403_burst'
  | 'destructive_rapid_burst';

export function threatSignalForAnomaly(kind: AnomalyKind, httpStatus?: number): ThreatSignalId {
  switch (kind) {
    case 'failed_login_burst':
      return 'AUTH_BRUTE_FORCE_SUSPECTED';
    case 'step_up_failure_burst':
      return 'STEP_UP_ABUSE_SUSPECTED';
    case 'csrf_failure_burst':
      return 'CSRF_ABUSE_SUSPECTED';
    case 'tenant_scope_violation_burst':
      return 'TENANT_PROBE_SUSPECTED';
    case 'session_binding_mismatch_burst':
      return 'SESSION_BINDING_ABUSE_SUSPECTED';
    case 'superadmin_mutation_burst':
      return 'SUPERADMIN_ANOMALY_SUSPECTED';
    case 'sensitive_route_403_burst':
      return 'PRIVILEGE_ABUSE_SUSPECTED';
    case 'destructive_rapid_burst':
      return 'DESTRUCTIVE_BURST_SUSPECTED';
    case 'http_auth_error_burst':
      if (httpStatus === 403) return 'PRIVILEGE_ABUSE_SUSPECTED';
      return 'API_CREDENTIAL_PROBE_SUSPECTED';
  }
}
