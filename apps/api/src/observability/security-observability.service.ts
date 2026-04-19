import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SECURITY_EVENT_NAME,
  type SecurityEventCategory,
  type SecurityEventPayload,
  type SecurityEventResult,
  type SecurityEventSeverity,
} from './security-event.model';
import {
  threatEventName,
  threatSignalForAnomaly,
  type AnomalyKind,
  type ThreatSignalId,
} from './threat-detection.model';
import { isSensitiveApiPath } from './sensitive-routes.util';

const SENSITIVE_KEY_SUBSTR = ['password', 'secret', 'token', 'refresh', 'otp', 'code', 'pin', 'authorization', 'cookie'];

export type SecurityPersistInput = {
  event: string;
  userId: number | null;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
  /** Optional alert-ready metadata (stored inside `details.telemetry` for DB rows). */
  severity?: SecurityEventSeverity;
  category?: SecurityEventCategory;
  event_name?: string;
};

export type EmitAnomalyThresholdInput = {
  anomaly_type: AnomalyKind;
  threshold: number;
  observed: number;
  window_ms: number;
  aggregation_key: string;
  ip?: string | null;
  route?: string;
  status?: number;
  actor_user_id?: number | null;
  actor_role?: string | null;
  resource?: string;
  method?: string;
};

/**
 * Production security observability: structured logs (JSON lines) + optional DB persistence
 * for the existing `security_logs` / admin Security UI. Never log secrets or raw tokens.
 */
@Injectable()
export class SecurityObservabilityService {
  private readonly logger = new Logger(SecurityObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Primary alert-ready log line. Prefer this over `structured()` for new code.
   */
  securityEvent(payload: SecurityEventPayload): void {
    const alert =
      payload.alert !== undefined
        ? payload.alert
        : payload.severity === 'high' ||
          payload.severity === 'critical' ||
          payload.category === 'anomaly';

    const envelope: Record<string, unknown> = {
      ts: new Date().toISOString(),
      component: 'security_audit',
      schema_version: 1,
      alert,
      severity: payload.severity,
      category: payload.category,
      event_name: payload.event_name,
      result: payload.result,
      actor_user_id: payload.actor_user_id ?? null,
      actor_role: payload.actor_role ?? null,
      route: payload.route,
      aggregation_key: payload.aggregation_key ?? null,
      target: payload.target ?? null,
      ...this.shallowRedact(payload.details || {}),
    };

    this.logger.log(JSON.stringify(envelope));
  }

  /** @deprecated Prefer `securityEvent` with explicit severity/category. */
  structured(event: string, fields: Record<string, unknown>) {
    this.securityEvent({
      event_name: SECURITY_EVENT_NAME.LEGACY,
      severity: 'medium',
      category: 'anomaly',
      alert: false,
      details: { legacy_event: event, ...fields },
    });
  }

  /**
   * Elevates an in-process threshold crossing to a normalized threat-detection signal
   * (`component: threat_detection`) and persists a compact row for Security UI / SIEM.
   */
  emitAnomalyThreshold(input: EmitAnomalyThresholdInput): void {
    const threatId: ThreatSignalId = threatSignalForAnomaly(input.anomaly_type, input.status);
    const eventName = threatEventName(threatId);

    const envelope: Record<string, unknown> = {
      ts: new Date().toISOString(),
      component: 'threat_detection',
      schema_version: 2,
      threat_signal_id: threatId,
      event_name: eventName,
      severity: 'high',
      confidence: 'elevated',
      actor_user_id: input.actor_user_id ?? null,
      actor_role: input.actor_role ?? null,
      route: input.route ?? null,
      aggregation_key: input.aggregation_key,
      ip: input.ip ?? null,
      anomaly_kind: input.anomaly_type,
      threshold: input.threshold,
      observed: input.observed,
      window_ms: input.window_ms,
      http_status: input.status ?? null,
      method: input.method ?? null,
      resource: input.resource ?? null,
    };

    this.logger.log(JSON.stringify(this.shallowRedact(envelope)));

    void this.persist({
      event: 'THREAT_SIGNAL',
      userId: input.actor_user_id ?? null,
      success: false,
      ipAddress: input.ip,
      severity: 'high',
      category: 'anomaly',
      event_name: eventName,
      details: {
        threat_signal_id: threatId,
        telemetry: {
          event_name: eventName,
          severity: 'high' as const,
          category: 'anomaly' as const,
        },
        anomaly_kind: input.anomaly_type,
        aggregation_key: input.aggregation_key,
        threshold: input.threshold,
        observed: input.observed,
        window_ms: input.window_ms,
        route: input.route,
      },
    });
  }

  async persist(input: SecurityPersistInput) {
    const telemetry =
      input.severity || input.category || input.event_name
        ? {
            severity: input.severity,
            category: input.category,
            event_name: input.event_name,
          }
        : undefined;
    const details =
      telemetry || input.details
        ? {
            ...(input.details || {}),
            ...(telemetry ? { telemetry } : {}),
          }
        : undefined;

    await this.prisma.securityLog
      .create({
        data: {
          event: input.event,
          userId: input.userId,
          success: input.success,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          details: details as object | undefined,
        },
      })
      .catch(() => undefined);
  }

  /** Structured line + DB row (for new admin/superadmin events). */
  async record(input: SecurityPersistInput) {
    const event_name = input.event_name ?? `ruhiyat.security.db.${input.event.toLowerCase()}`;
    const severity: SecurityEventSeverity = input.severity ?? (input.success ? 'low' : 'medium');
    const category: SecurityEventCategory = input.category ?? 'privilege';
    const route =
      input.details && typeof input.details.path === 'string'
        ? String(input.details.path).split('?')[0]
        : undefined;

    this.securityEvent({
      event_name,
      severity,
      category,
      alert: !input.success && (severity === 'high' || severity === 'critical'),
      result: (input.success ? 'success' : 'failure') as SecurityEventResult,
      actor_user_id: input.userId,
      route,
      details: {
        db_event: input.event,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        ...(input.details || {}),
      },
    });
    await this.persist({ ...input, severity, category, event_name });
  }

  /**
   * 403/401 visibility — always structured; DB only for authenticated 403 on sensitive routes
   * to avoid flooding from anonymous traffic.
   */
  logHttpException(params: {
    status: number;
    method: string;
    path: string;
    message?: string;
    userId: number | null;
    role: string | null;
    ip?: string | null;
  }) {
    const route = params.path.split('?')[0];
    const is401 = params.status === 401;
    this.securityEvent({
      event_name: is401 ? SECURITY_EVENT_NAME.HTTP_UNAUTHORIZED : SECURITY_EVENT_NAME.HTTP_FORBIDDEN,
      severity: is401 ? 'low' : 'medium',
      category: 'privilege',
      alert: false,
      result: 'blocked',
      actor_user_id: params.userId,
      actor_role: params.role,
      route,
      aggregation_key: `${params.status}:${params.userId ?? 'anon'}:${route}`,
      details: {
        method: params.method,
        message: params.message?.slice(0, 200),
        ip: params.ip,
      },
    });

    if (params.status === 403 && params.userId != null && isSensitiveApiPath(params.path)) {
      void this.persist({
        event: 'PERMISSION_DENIED',
        userId: params.userId,
        success: false,
        event_name: SECURITY_EVENT_NAME.PRIVILEGE_DENIED,
        severity: 'medium',
        category: 'privilege',
        details: {
          path: route,
          method: params.method,
          role: params.role,
          hint: params.message?.slice(0, 160),
        },
      });
    }
  }

  logCsrfFailure(params: { path: string; method: string; reason: string; ip: string | null | undefined }) {
    const route = params.path.split('?')[0];
    this.securityEvent({
      event_name: SECURITY_EVENT_NAME.CSRF_VALIDATION_FAILED,
      severity: 'medium',
      category: 'csrf',
      alert: true,
      result: 'blocked',
      route,
      aggregation_key: `csrf:${params.ip || 'unknown'}:${route}`,
      details: {
        reason: params.reason,
        method: params.method,
        ip: params.ip,
      },
    });
  }

  shallowRedact(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEY_SUBSTR.some((s) => lower.includes(s))) {
        out[k] = '[REDACTED]';
      } else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        out[k] = this.shallowRedact(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  /** Safe summary for integration / setting payloads (keys only or redacted). */
  summarizeMutationBody(body: unknown, maxKeys = 24): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};
    const o = body as Record<string, unknown>;
    const keys = Object.keys(o).slice(0, maxKeys);
    const summary: Record<string, unknown> = {};
    for (const k of keys) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEY_SUBSTR.some((s) => lower.includes(s))) {
        summary[k] = '[REDACTED]';
      } else {
        const v = o[k];
        summary[k] = typeof v === 'object' ? '[object]' : v;
      }
    }
    return summary;
  }
}
