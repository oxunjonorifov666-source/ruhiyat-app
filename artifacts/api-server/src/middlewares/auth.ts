import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // TODO: Implement JWT verification
    // const payload = jwt.verify(token, process.env.JWT_SECRET!);
    // req.userId = payload.userId;
    // req.userRole = payload.role;
    logger.debug("Auth middleware: token verification not yet implemented");
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
