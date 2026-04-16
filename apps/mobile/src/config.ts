import Constants from "expo-constants";

/** Lokal backend (LAN). `app.json` → `expo.extra.apiUrl` bilan almashtirish mumkin; buildda `EXPO_PUBLIC_API_URL` ham `app.config.js` orqali keladi. */
export const DEFAULT_API_BASE_URL = "http://192.168.137.157:3001/api";

/**
 * Bitta manzil: avvalo `expo.extra.apiUrl` (app.json / EAS env), bo‘lmasa DEFAULT_API_BASE_URL.
 * Release APK va dev bir xil mantiq — localhost / 127.0.0.1 ishlatilmaydi.
 */
function pickApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string; apiPort?: number } | undefined;
  const fromExtra = typeof extra?.apiUrl === "string" ? extra.apiUrl.trim() : "";
  if (fromExtra) {
    return fromExtra;
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = pickApiBaseUrl();

/** Statik fayllar (`/uploads/...`) uchun origin — `/api` siz. */
export const API_ORIGIN = API_BASE_URL.replace(/\/?api\/?$/i, "");

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_ORIGIN.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export const TOKEN_KEYS = {
  ACCESS_TOKEN: "ruhiyat_access_token",
  REFRESH_TOKEN: "ruhiyat_refresh_token",
} as const;

export const ROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMINISTRATOR: "ADMINISTRATOR",
  MOBILE_USER: "MOBILE_USER",
} as const;

export const APP_NAME = "Ruhiyat";
