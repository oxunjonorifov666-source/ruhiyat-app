export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || '/api';

export const APP_NAME = 'Ruhiyat';

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
} as const;

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'ruhiyat_access_token',
  REFRESH_TOKEN: 'ruhiyat_refresh_token',
  /** Short-lived proof after POST /auth/verify-password (HttpOnly cookie). */
  STEP_UP_TOKEN: 'ruhiyat_step_up',
  /**
   * Non-HttpOnly double-submit CSRF cookie; must match `X-CSRF-Token` on mutations when
   * the HttpOnly access cookie is sent. See API CSRF documentation.
   */
  CSRF_TOKEN: 'ruhiyat_csrf_token',
} as const;

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MOBILE_USER: 'MOBILE_USER',
} as const;
