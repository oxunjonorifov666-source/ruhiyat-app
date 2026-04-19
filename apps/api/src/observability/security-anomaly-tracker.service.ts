import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityObservabilityService } from './security-observability.service';
import { loadSecurityAnomalyThresholds, type SecurityAnomalyThresholds } from './security-anomaly-thresholds';
import type { AnomalyKind } from './threat-detection.model';

function normalizeRoute(path: string): string {
  return String(path || '').split('?')[0].slice(0, 256);
}

/**
 * Lightweight in-memory sliding windows for threat-detection signals.
 * Resets on process restart; external monitors should still correlate raw per-event logs.
 */
@Injectable()
export class SecurityAnomalyTrackerService {
  private readonly thresholds: SecurityAnomalyThresholds;
  private readonly hits = new Map<string, number[]>();
  private readonly lastAlert = new Map<string, number>();
  private readonly alertCooldownMs = 5 * 60 * 1000;

  constructor(
    private readonly config: ConfigService,
    private readonly securityObs: SecurityObservabilityService,
  ) {
    this.thresholds = loadSecurityAnomalyThresholds(config);
  }

  private prune(key: string, windowMs: number): number[] {
    const now = Date.now();
    const cutoff = now - windowMs;
    const arr = (this.hits.get(key) || []).filter((t) => t > cutoff);
    this.hits.set(key, arr);
    return arr;
  }

  private touch(key: string, windowMs: number): number {
    const now = Date.now();
    const arr = this.prune(key, windowMs);
    arr.push(now);
    this.hits.set(key, arr);
    return arr.length;
  }

  private shouldEmitBurst(key: string): boolean {
    const now = Date.now();
    const last = this.lastAlert.get(key) ?? 0;
    if (now - last < this.alertCooldownMs) return false;
    this.lastAlert.set(key, now);
    return true;
  }

  private emitThreshold(
    kind: AnomalyKind,
    params: {
      threshold: number;
      observed: number;
      windowMs: number;
      aggregation_key: string;
      ip?: string | null;
      route?: string;
      status?: number;
      actor_user_id?: number | null;
      actor_role?: string | null;
      resource?: string;
      method?: string;
    },
  ): void {
    this.securityObs.emitAnomalyThreshold({
      anomaly_type: kind,
      threshold: params.threshold,
      observed: params.observed,
      window_ms: params.windowMs,
      aggregation_key: params.aggregation_key,
      ip: params.ip,
      route: params.route,
      status: params.status,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      resource: params.resource,
      method: params.method,
    });
  }

  observeFailedLogin(ip: string | null | undefined): void {
    const key = `login_fail:${ip || 'unknown'}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.failedLoginPerIp && this.shouldEmitBurst(key)) {
      this.emitThreshold('failed_login_burst', {
        threshold: this.thresholds.failedLoginPerIp,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        ip: ip || null,
      });
    }
  }

  observeStepUpFailure(userId: number): void {
    const key = `step_up_fail:${userId}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.stepUpFailurePerUser && this.shouldEmitBurst(key)) {
      this.emitThreshold('step_up_failure_burst', {
        threshold: this.thresholds.stepUpFailurePerUser,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        actor_user_id: userId,
      });
    }
  }

  observeCsrfFailure(ip: string | null | undefined): void {
    const key = `csrf:${ip || 'unknown'}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.csrfFailurePerIp && this.shouldEmitBurst(key)) {
      this.emitThreshold('csrf_failure_burst', {
        threshold: this.thresholds.csrfFailurePerIp,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        ip: ip || null,
      });
    }
  }

  observeHttpAuthError(params: {
    status: 401 | 403;
    ip: string | null | undefined;
    userId: number | null | undefined;
    path: string;
    role: string | null | undefined;
  }): void {
    const route = normalizeRoute(params.path);
    const actor = params.userId != null ? `u:${params.userId}` : `ip:${params.ip || 'unknown'}`;
    const key = `http_${params.status}:${actor}:${route}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.httpAuthErrorPerActorRoute && this.shouldEmitBurst(key)) {
      this.emitThreshold('http_auth_error_burst', {
        threshold: this.thresholds.httpAuthErrorPerActorRoute,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        route,
        status: params.status,
        actor_user_id: params.userId ?? null,
        actor_role: params.role ?? null,
        ip: params.ip || null,
      });
    }
  }

  /**
   * Authenticated user repeatedly gets 403 on a sensitive API route (horizontal/vertical probe).
   * Counted separately from `observeHttpAuthError` to use a stricter threshold.
   */
  observeSensitiveRoute403(params: {
    userId: number;
    path: string;
    role: string | null | undefined;
    ip: string | null | undefined;
  }): void {
    const route = normalizeRoute(params.path);
    const key = `sens403:u:${params.userId}:${route}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (
      n >= this.thresholds.sensitiveRoute403PerActorRoute &&
      this.shouldEmitBurst(key)
    ) {
      this.emitThreshold('sensitive_route_403_burst', {
        threshold: this.thresholds.sensitiveRoute403PerActorRoute,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        route,
        status: 403,
        actor_user_id: params.userId,
        actor_role: params.role ?? null,
        ip: params.ip || null,
      });
    }
  }

  observeDestructiveAction(params: {
    userId: number | null | undefined;
    role: string | null | undefined;
    method: string;
    path: string;
    resource: string;
  }): void {
    if (!params.userId) return;
    const route = normalizeRoute(params.path);
    const key = `destruct:${params.userId}`;
    const n = this.touch(key, this.thresholds.destructiveWindowMs);
    if (n >= this.thresholds.destructivePerUser && this.shouldEmitBurst(key)) {
      this.emitThreshold('destructive_rapid_burst', {
        threshold: this.thresholds.destructivePerUser,
        observed: n,
        windowMs: this.thresholds.destructiveWindowMs,
        aggregation_key: key,
        route,
        actor_user_id: params.userId,
        actor_role: params.role ?? null,
        resource: params.resource,
        method: params.method,
      });
    }
  }

  /** Repeated tenant scope mismatches for one actor (possible probe). */
  observeTenantScopeViolation(userId: number, route: string): void {
    const key = `tenant_viol:${userId}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.tenantViolationPerUser && this.shouldEmitBurst(key)) {
      this.emitThreshold('tenant_scope_violation_burst', {
        threshold: this.thresholds.tenantViolationPerUser,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        route: normalizeRoute(route),
        actor_user_id: userId,
      });
    }
  }

  /** Count each session binding mismatch; emit threat signal when threshold exceeded. */
  observeSessionBindingMismatch(userId: number, ip: string | null | undefined): void {
    const key = `sess_bind:${userId}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.sessionBindingMismatchPerUser && this.shouldEmitBurst(key)) {
      this.emitThreshold('session_binding_mismatch_burst', {
        threshold: this.thresholds.sessionBindingMismatchPerUser,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        actor_user_id: userId,
        ip: ip || null,
      });
    }
  }

  /** Many superadmin setting changes in a short window (possible abuse or automation). */
  observeSuperadminSensitiveMutation(actorUserId: number): void {
    const key = `superadmin:${actorUserId}`;
    const n = this.touch(key, this.thresholds.windowMs);
    if (n >= this.thresholds.superadminMutationPerActor && this.shouldEmitBurst(key)) {
      this.emitThreshold('superadmin_mutation_burst', {
        threshold: this.thresholds.superadminMutationPerActor,
        observed: n,
        windowMs: this.thresholds.windowMs,
        aggregation_key: key,
        actor_user_id: actorUserId,
        actor_role: 'SUPERADMIN',
      });
    }
  }
}
