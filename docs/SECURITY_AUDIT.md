# Ruhiyat — Security Audit Report

**Date:** 2026-04-03
**Auditor:** Internal Security Review
**Scope:** Backend API, Auth, RBAC, Data Protection, Mobile, Config

---

## 1. Auth Security

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| JWT access token (15min expiry) | PASS | Low | Short-lived, signed with configurable secret |
| JWT refresh token (7d expiry) | PASS | Low | Stored as SHA-256 hash in DB, rotated on use |
| Refresh token rotation | PASS | Low | Old token revoked on refresh (replay protection) |
| Logout invalidation | PASS | Low | Revokes refresh token session in DB |
| Token leakage prevention | PASS | Low | `sanitizeUser()` strips sensitive fields |
| OTP flow security | PASS | Low | 5-attempt limit, 5-minute expiry, purpose restricted to enum |
| OTP purpose validation | FIXED | Was High | Purpose now restricted to `login/registration/verification/password_reset` |
| JWT secret production check | PASS | Low | Both `JWT_SECRET` and `JWT_REFRESH_SECRET` throw if missing in production |

## 2. Password Security

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| bcrypt hashing | PASS | Low | 12 rounds for all passwords |
| No plaintext passwords | PASS | Low | Only hashes stored, sensitive fields sanitized |
| Password strength rules | FIXED | Was Medium | Now requires 8+ chars, uppercase, lowercase, digit |
| Hardcoded psychologist password | FIXED | Was High | Now generates random 12-byte cryptographic password |

## 3. Role-Based Access Control (RBAC)

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Role separation (SUPERADMIN/ADMINISTRATOR/MOBILE_USER) | PASS | Low | Enforced via `RolesGuard` + `@Roles()` decorator |
| Users controller (CRUD) | PASS | Low | SUPERADMIN only for write ops |
| Roles controller | PASS | Low | SUPERADMIN only |
| System/Settings controller | PASS | Low | SUPERADMIN only |
| Education Centers write ops | PASS | Low | SUPERADMIN for create/delete, admin with center-scope check |
| Content controller (articles, audio, video, etc.) | FIXED | Was High | Write ops now require SUPERADMIN or ADMINISTRATOR role |
| Community controller (posts, moderation) | FIXED | Was High | Moderation/complaints restricted to SUPERADMIN/ADMINISTRATOR |
| Assessments controller (tests) | FIXED | Was Medium | Test creation/update restricted to SUPERADMIN/ADMINISTRATOR |
| Finance controller (payments, transactions) | FIXED | Was High | Now requires SUPERADMIN or ADMINISTRATOR role |
| Meetings controller (create/update/delete) | FIXED | Was Medium | Write ops restricted to SUPERADMIN/ADMINISTRATOR |
| Communication controller (notifications, announcements) | FIXED | Was Medium | Creating notifications/announcements restricted to admins |
| Courses controller (courses, groups, enrollments) | FIXED | Was Medium | Write ops restricted to SUPERADMIN/ADMINISTRATOR |

## 4. API Security

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Input validation (ValidationPipe) | PASS | Low | Global pipe with whitelist + forbidNonWhitelisted |
| DTO validation (class-validator) | PASS | Low | All auth DTOs use proper decorators |
| SQL injection prevention | PASS | Low | Prisma ORM uses parameterized queries |
| Error handling (exception filter) | FIXED | Was Medium | Global HttpExceptionFilter strips stack traces in production |
| Rate limiting (global) | FIXED | Was Critical | ThrottlerGuard now applied globally (100 req/min default) |
| Auth endpoint rate limiting | FIXED | Was Critical | Login: 10/min, Register: 5/min, OTP send: 3/min |
| CORS policy | FIXED | Was Critical | Restricted to configured origins (blocks all in production if none set) |
| Security headers (Helmet) | FIXED | Was High | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| Input sanitization | PASS | Low | Whitelist mode strips unknown properties |

## 5. Data Protection

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Center-scoped admin access (IDOR) | PASS | Low | `verifyCenterAccess()` checks admin-center relationship |
| User data isolation | PASS | Low | JWT-based user identification for personal data |
| Password hash exclusion from responses | PASS | Low | `sanitizeUser()` excludes hash |

## 6. Session & Token Management

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Session storage | PASS | Low | DB-backed sessions with SHA-256 hashed tokens |
| Token refresh rotation | PASS | Low | Old session revoked, new one created |
| Expired token handling | PASS | Low | Strategy checks `ignoreExpiration: false` |
| Deactivated user check | PASS | Low | JWT strategy validates `isActive` on every request |

## 7. Mobile Security

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Token storage (SecureStore) | PASS | Low | Uses `expo-secure-store` for encrypted storage |
| Auto refresh on 401 | PASS | Low | Silent token refresh with callback to update SecureStore |
| Logout cleanup | PASS | Low | Clears both SecureStore and in-memory tokens |
| No sensitive data in plaintext | PASS | Low | Tokens only in SecureStore, not AsyncStorage |

## 8. Audit Logging

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Write operation logging | FIXED | Was High | Global AuditLogInterceptor logs all POST/PATCH/PUT/DELETE |
| Sensitive data redaction | PASS | Low | Passwords, tokens, OTP codes redacted from logs |
| Structured log format | PASS | Low | Includes userId, action, resource, IP, userAgent |

## 9. Config & Environment Security

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| JWT_SECRET production check | PASS | Low | Throws error if missing in production |
| JWT_REFRESH_SECRET production check | FIXED | Was High | Now throws error if missing in production |
| Dev fallback secrets | PASS | Low | Only used in development, clearly labeled NOT-FOR-PRODUCTION |
| No hardcoded secrets in code | FIXED | Was High | Removed hardcoded psychologist password |

---

## Summary of Fixes Applied

1. **Helmet security headers** — Added CSP, HSTS, X-Frame-Options, etc.
2. **CORS restriction** — Now configurable via `CORS_ORIGINS` env var, blocks all origins in production by default
3. **Rate limiting activated** — ThrottlerGuard applied globally (was imported but never used)
4. **Auth rate limiting** — Stricter limits on login (10/min), register (5/min), OTP (3/min), password reset (3/min)
5. **RBAC on all write endpoints** — Content, community, assessments, finance, meetings, communication, courses controllers now enforce role-based access
6. **Global exception filter** — Stack traces hidden in production, structured error responses
7. **Audit logging** — All write operations automatically logged with user, action, resource, IP
8. **Password strength validation** — 8+ chars, uppercase, lowercase, digit required
9. **OTP purpose enum** — Restricted to 4 valid values (was free string)
10. **Hardcoded password removed** — Psychologist creation uses cryptographic random password
11. **JWT_REFRESH_SECRET production check** — Throws if missing in production

---

## Remaining Known Risks

| Risk | Severity | Description | Recommendation |
|------|----------|-------------|----------------|
| localStorage token storage (Web) | Medium | Web panel tokens stored in localStorage, vulnerable to XSS | Consider httpOnly cookies for web panels in future |
| No CSRF protection | Low | API is stateless JWT-based, low risk | Add CSRF tokens if switching to cookie auth |
| No request body size limit | Low | Could allow large payload attacks | Add body size limits in production |
| Session cleanup (expired) | Low | Expired sessions accumulate in DB | Add periodic cleanup cron job |
| No IP-based brute force blocking | Low | Rate limiting is per-IP via throttler | Consider fail2ban or WAF for production |
| OTP code not sent (dev) | Info | OTP codes are generated but not actually sent | Integrate SMS/email provider before production |

---

## Pre-Deployment Checklist

- [ ] Set `JWT_SECRET` environment variable (strong, random, 256+ bit)
- [ ] Set `JWT_REFRESH_SECRET` environment variable (different from JWT_SECRET)
- [ ] Set `CORS_ORIGINS` to allowed frontend domains (comma-separated)
- [ ] Set `NODE_ENV=production`
- [ ] Integrate OTP delivery (SMS/email provider)
- [ ] Set up database backup schedule
- [ ] Set up expired session cleanup (cron or scheduled task)
- [ ] Review and adjust rate limits based on expected traffic
- [ ] Enable HTTPS termination (handled by Replit in deployment)
- [ ] Run penetration testing
- [ ] Review audit logs for suspicious activity patterns
