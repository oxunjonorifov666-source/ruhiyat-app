import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** NEXT_PUBLIC_API_URL ba'zan `http://host:port/api` ko'rinishida bo'ladi — rewrite uchun faqat origin kerak */
function normalizeApiOrigin(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  if (u.endsWith("/api")) u = u.slice(0, -4);
  return u
}

// `apps/api/.env` dagi PORT bilan bir xil bo‘lishi kerak (odatda 3001).
// Windows’da `localhost` → IPv6 / DNS muammosi bo‘lishi mumkin — rewrite uchun 127.0.0.1 barqaror.
const apiBaseUrl = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001");

function cspConnectSrc(): string {
  try {
    const u = new URL(apiBaseUrl.startsWith("http") ? apiBaseUrl : `http://${apiBaseUrl}`);
    const host = u.host;
    return `'self' ${u.origin} ws://${host} wss://${host} https://wttr.in`;
  } catch {
    return "'self' https://wttr.in";
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src ${cspConnectSrc()}`,
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  basePath: "/superadmin",
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  transpilePackages: ["@ruhiyat/ui", "@ruhiyat/types", "@ruhiyat/config"],
  ...(isProd ? {} : { allowedDevOrigins: ["*"] as const }),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
  async rewrites() {
    const toBackend = `${apiBaseUrl}/api/:path*`;
    // basePath: "/superadmin" bo'lsa, rewrite source avtomatik prefiks olmasligi kerak — aks holda `/api` 404 bo'ladi
    return [
      { source: "/api/:path*", destination: toBackend, basePath: false },
      { source: "/superadmin/api/:path*", destination: toBackend, basePath: false },
    ];
  },
};

export default nextConfig;
