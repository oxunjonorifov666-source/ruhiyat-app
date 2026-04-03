import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export interface AuditEntry {
  userId?: number;
  action: string;
  resource: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  // TODO: Implement database insert to audit_logs table
  logger.info({ audit: entry }, "Audit event recorded");
}

export function auditMiddleware(action: string, resource: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // TODO: Hook into response lifecycle to log after successful operations
    logger.debug({ action, resource }, "Audit middleware attached");
    next();
  };
}
