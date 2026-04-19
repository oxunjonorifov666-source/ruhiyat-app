import { ConfigService } from '@nestjs/config';

/**
 * In-code defaults for anomaly detection windows. Override via env in production.
 * These are not a full rules engine — they only emit structured `ANOMALY_THRESHOLD_EXCEEDED` signals.
 */
export type SecurityAnomalyThresholds = {
  windowMs: number;
  /** Failed POST /auth/login (per client IP). */
  failedLoginPerIp: number;
  /** 401 or 403 responses per (actor or IP) + normalized route. */
  httpAuthErrorPerActorRoute: number;
  /**
   * Stricter: authenticated 403 on high-impact API prefixes (per user + route).
   * Catches vertical privilege probing with fewer false positives than global 403 rate.
   */
  sensitiveRoute403PerActorRoute: number;
  /** CSRF failures per IP. */
  csrfFailurePerIp: number;
  /** Step-up password check failures per user. */
  stepUpFailurePerUser: number;
  /** DELETE (or destructive POST) successes per user in short window. */
  destructivePerUser: number;
  destructiveWindowMs: number;
  /** Tenant scope mismatch attempts per user (possible cross-tenant probe). */
  tenantViolationPerUser: number;
  /** Session refresh binding mismatches per user (possible token theft / env change). */
  sessionBindingMismatchPerUser: number;
  /** Superadmin system/mobile setting mutations per actor in window (noise-resistant). */
  superadminMutationPerActor: number;
};

const int = (v: string | undefined, fallback: number) => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function loadSecurityAnomalyThresholds(config: ConfigService): SecurityAnomalyThresholds {
  return {
    windowMs: int(config.get<string>('SECURITY_ALERT_WINDOW_MS'), 10 * 60 * 1000),
    failedLoginPerIp: int(config.get<string>('SECURITY_FAILED_LOGIN_BURST'), 8),
    httpAuthErrorPerActorRoute: int(config.get<string>('SECURITY_HTTP_AUTH_ERROR_BURST'), 12),
    sensitiveRoute403PerActorRoute: int(
      config.get<string>('SECURITY_SENSITIVE_ROUTE_403_BURST'),
      4,
    ),
    csrfFailurePerIp: int(config.get<string>('SECURITY_CSRF_FAILURE_BURST'), 15),
    stepUpFailurePerUser: int(config.get<string>('SECURITY_STEP_UP_FAIL_BURST'), 5),
    destructivePerUser: int(config.get<string>('SECURITY_DESTRUCTIVE_BURST'), 8),
    destructiveWindowMs: int(config.get<string>('SECURITY_DESTRUCTIVE_WINDOW_MS'), 2 * 60 * 1000),
    tenantViolationPerUser: int(config.get<string>('SECURITY_TENANT_VIOLATION_BURST'), 5),
    sessionBindingMismatchPerUser: int(config.get<string>('SECURITY_SESSION_BINDING_MISMATCH_BURST'), 4),
    superadminMutationPerActor: int(config.get<string>('SECURITY_SUPERADMIN_MUTATION_BURST'), 15),
  };
}
