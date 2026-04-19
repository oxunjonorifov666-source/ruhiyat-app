import type { ConfigService } from '@nestjs/config';

const DEV_FALLBACK = 'ruhiyat-dev-secret-NOT-FOR-PRODUCTION';

/**
 * Fails fast at process startup when production would otherwise run with no signing secret.
 */
export function assertProductionJwtSecretPresent(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error('FATAL: JWT_SECRET must be set in production');
  }
}

type ConfigGet = { get: (k: string) => string | undefined };

export function getAccessJwtSecretForAuth(config: ConfigGet): string {
  const s = config.get('JWT_SECRET')?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return DEV_FALLBACK;
}

/**
 * Step-up HMAC: prefer JWT_STEP_UP_SECRET, else derived from the same access secret as other JWTs.
 */
export function getStepUpHmacSecret(config: ConfigGet): string {
  const custom = config.get('JWT_STEP_UP_SECRET')?.trim();
  if (custom) return custom;
  return `${getAccessJwtSecretForAuth(config)}.step-up.v1`;
}
