import type { NextConfig } from "next";

const isReplit = !!process.env.REPLIT_DEV_DOMAIN;

/** NEXT_PUBLIC_API_URL ba'zan `http://host:port/api` ko'rinishida bo'ladi — rewrite uchun faqat origin kerak */
function normalizeApiOrigin(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  if (u.endsWith("/api")) u = u.slice(0, -4);
  return u
}

// `apps/api/.env` dagi PORT bilan bir xil bo‘lishi kerak (odatda 3001).
// Windows’da `localhost` → IPv6 / DNS muammosi bo‘lishi mumkin — rewrite uchun 127.0.0.1 barqaror.
const apiBaseUrl = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001");

const nextConfig: NextConfig = {
  basePath: "/superadmin",
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  transpilePackages: ["@ruhiyat/ui", "@ruhiyat/types", "@ruhiyat/config"],
  allowedDevOrigins: ["*"],
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
