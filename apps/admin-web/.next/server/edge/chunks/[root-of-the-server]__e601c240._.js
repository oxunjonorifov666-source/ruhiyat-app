(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__e601c240._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/packages/config/src/index.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_BASE_URL",
    ()=>API_BASE_URL,
    "APP_NAME",
    ()=>APP_NAME,
    "PAGINATION_DEFAULTS",
    ()=>PAGINATION_DEFAULTS,
    "ROLES",
    ()=>ROLES,
    "TOKEN_KEYS",
    ()=>TOKEN_KEYS
]);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || '/api';
const APP_NAME = 'Ruhiyat';
const PAGINATION_DEFAULTS = {
    page: 1,
    limit: 20
};
const TOKEN_KEYS = {
    ACCESS_TOKEN: 'ruhiyat_access_token',
    REFRESH_TOKEN: 'ruhiyat_refresh_token'
};
const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMINISTRATOR: 'ADMINISTRATOR',
    MOBILE_USER: 'MOBILE_USER'
};
}),
"[project]/apps/admin-web/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$config$2f$src$2f$index$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/config/src/index.ts [middleware-edge] (ecmascript)");
;
;
function noCacheHeaders(response) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}
function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const isPublicRoute = pathname.includes('/login') || pathname.startsWith('/api') || pathname.startsWith('/admin/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico';
    if (isPublicRoute) {
        return noCacheHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
    }
    const token = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$config$2f$src$2f$index$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TOKEN_KEYS"].ACCESS_TOKEN)?.value || request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$config$2f$src$2f$index$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TOKEN_KEYS"].REFRESH_TOKEN)?.value;
    if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const redirect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        return noCacheHeaders(redirect);
    }
    return noCacheHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
}
const config = {
    matcher: [
        '/(.*)',
        '/'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__e601c240._.js.map