import { ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getStepUpHmacSecret } from '../common/config/jwt-secrets.util';
import { STEP_UP_COOKIE_NAME } from './auth-cookie.helper';
import type { AuthUser } from '@ruhiyat/types';

export function getStepUpSecret(config: { get: (k: string) => string | undefined }): string {
  return getStepUpHmacSecret(config);
}

/**
 * Validates HttpOnly step-up cookie or `x-step-up-token` header against the current user.
 */
export function assertStepUpSatisfied(
  req: { cookies?: Record<string, string>; headers: Record<string, unknown> },
  user: AuthUser,
  secret: string,
): void {
  const rawHeader = req.headers['x-step-up-token'];
  const fromHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const fromCookie = req.cookies?.[STEP_UP_COOKIE_NAME];
  const token =
    typeof fromCookie === 'string' && fromCookie.length > 0
      ? fromCookie
      : typeof fromHeader === 'string' && fromHeader.length > 0
        ? fromHeader
        : undefined;

  if (!token) {
    throw new ForbiddenException('Qayta tasdiqlash talab qilinadi (parol)');
  }

  try {
    const payload = jwt.verify(token, secret) as { sub?: number; typ?: string };
    if (payload.typ !== 'step-up' || payload.sub !== user.id) {
      throw new ForbiddenException('Qayta tasdiqlash yaroqsiz');
    }
  } catch (e) {
    if (e instanceof ForbiddenException) throw e;
    throw new ForbiddenException('Qayta tasdiqlash muddati o‘tgan yoki yaroqsiz');
  }
}
