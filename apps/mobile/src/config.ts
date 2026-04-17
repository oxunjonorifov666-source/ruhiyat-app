import Constants from "expo-constants";

/** Production backend (Render). Oxirgi fallback — EAS `EXPO_PUBLIC_API_URL` yoki `extra.apiUrl` bo‘lmasa. */
export const DEFAULT_API_BASE_URL = "https://ruhiyat-app.onrender.com/api";

function normalizeBaseUrl(u: string): string {
  return u.replace(/\/+$/, "");
}

/**
 * 1) EXPO_PUBLIC_API_URL — EAS/Metro release buildda inline (eas.json env)
 * 2) expo.extra.apiUrl — app.config.js (process.env.EXPO_PUBLIC_API_URL || app.json)
 * 3) DEFAULT_API_BASE_URL
 */
function pickApiBaseUrl(): string {
  const fromPublic =
    typeof process.env.EXPO_PUBLIC_API_URL === "string" ? process.env.EXPO_PUBLIC_API_URL.trim() : "";
  if (fromPublic) {
    return normalizeBaseUrl(fromPublic);
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = typeof extra?.apiUrl === "string" ? extra.apiUrl.trim() : "";
  if (fromExtra) {
    return normalizeBaseUrl(fromExtra);
  }
  return normalizeBaseUrl(DEFAULT_API_BASE_URL);
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
