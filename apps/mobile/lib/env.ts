import Constants from 'expo-constants';

/**
 * API base including `/api` prefix (matches admin-web convention).
 * Production/staging: set `EXPO_PUBLIC_API_URL` (see `eas.json` build profiles) or `app.json` → `expo.extra.apiUrl`.
 * Local dev: defaults to `http://127.0.0.1:3000/api` when unset.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) {
    return fromExtra.replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:3000/api';
}
