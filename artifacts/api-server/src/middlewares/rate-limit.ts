import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = requestCounts.get(key);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      logger.warn({ ip: key, count: entry.count }, "Rate limit exceeded");
      res.status(429).json({ error: "Too many requests, please try again later" });
      return;
    }

    next();
  };
}
