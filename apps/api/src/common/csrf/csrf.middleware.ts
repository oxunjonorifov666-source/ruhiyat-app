import type { NextFunction, Request, Response } from 'express';
import { ACCESS_COOKIE_NAME } from '../../auth/auth-cookie.helper';
import {
  CSRF_HEADER_NAME,
  readCsrfTokenFromCookie,
  csrfTokensMatch,
} from '../../auth/csrf-cookie.helper';
import { SecurityObservabilityService } from '../../observability/security-observability.service';
import { SecurityAnomalyTrackerService } from '../../observability/security-anomaly-tracker.service';
import { CSRF_EXCLUDED_EXACT_PATHS, CSRF_EXCLUDED_PATH_PREFIXES } from './csrf-protection.config';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const EXACT = new Set(CSRF_EXCLUDED_EXACT_PATHS);

function normalizePath(pathname: string): string {
  const p = (pathname || '').split('?')[0] || '/';
  if (!p.startsWith('/')) return `/${p}`;
  return p.replace(/\/+$/, '') || '/';
}

function isCsrfExcludedPath(path: string): boolean {
  const p = normalizePath(path);
  if (EXACT.has(p)) return true;
  return CSRF_EXCLUDED_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

function classifyFailure(req: Request): 'missing_cookie' | 'missing_header' | 'mismatch' {
  const c = readCsrfTokenFromCookie(req);
  const raw = req.headers[CSRF_HEADER_NAME];
  const h = Array.isArray(raw) ? raw[0] : raw;
  if (!c) return 'missing_cookie';
  if (typeof h !== 'string' || !h.length) return 'missing_header';
  return 'mismatch';
}

/**
 * Rejects mutating browser requests that carry the access session cookie but no valid
 * double-submit CSRF proof (cookie + matching header).
 */
export function createCsrfProtectionMiddleware(
  securityObs: SecurityObservabilityService,
  anomalyTracker: SecurityAnomalyTrackerService,
) {
  return function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') return next();

    if (!MUTATING.has(req.method)) return next();

    const path = normalizePath(req.path || req.url || '');
    if (isCsrfExcludedPath(path)) return next();

    const access = req.cookies?.[ACCESS_COOKIE_NAME];
    if (typeof access !== 'string' || !access.length) {
      return next();
    }

    if (csrfTokensMatch(req)) {
      return next();
    }

    const reason = classifyFailure(req);
    const ip =
      req.ip ||
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined);

    const route = path.split('?')[0];
    securityObs.logCsrfFailure({
      path: route,
      method: req.method,
      reason,
      ip: ip || null,
    });
    anomalyTracker.observeCsrfFailure(ip || null);

    res.status(403).json({
      statusCode: 403,
      message: 'CSRF tekshiruvi muvaffaqiyatsiz',
      error: 'CSRF_FAILED',
    });
  };
}
