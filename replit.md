# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

pnpm workspace monorepo for "Ruhiyat" — a digital mental wellness platform. **All UI is Uzbek-first.**

1. **Superadmin Web Panel** (`apps/superadmin-web`) — 44+ pages, 8 nav sections, premium header/footer, real auth, RBAC-filtered sidebar (Next.js + Tailwind + shadcn/ui, artifact preview at `/superadmin/`)
2. **Administrator Web Panel** (`apps/admin-web`) — 23 modules, real auth, protected routes (Next.js + Tailwind + shadcn/ui, artifact preview at `/admin/`)
3. **Mobile App** (`apps/mobile`) — 12 screens, real auth with SecureStore, gated navigation (Expo + React Native, Android-first)
4. **Backend API** (`apps/api`) — 16 NestJS modules, 100+ endpoints, JWT auth, RBAC (NestJS + Prisma + PostgreSQL, port 3000)

## Authentication & Security

### Auth Flow
- **Login**: POST `/api/auth/login` with `{email, password}` or `{phone, password}`
- **Register**: POST `/api/auth/register` — password must be 8+ chars with uppercase, lowercase, digit
- **Profile**: GET `/api/auth/me` (Bearer token required)
- **Refresh**: POST `/api/auth/refresh` with `{refreshToken}` — rotates tokens, revokes old session
- **Logout**: POST `/api/auth/logout` with `{refreshToken}` — revokes session
- **OTP**: POST `/api/auth/otp/send` and `/api/auth/otp/verify` — purpose restricted to enum
- **Password Reset**: POST `/api/auth/password/reset-request` and `/api/auth/password/reset`

### Token Management
- JWT access tokens (15min), refresh tokens (7d)
- Refresh tokens stored as SHA-256 hashes in `sessions` table
- Web panels: localStorage + cookies (middleware reads cookies for server-side redirect)
- Mobile: expo-secure-store for persistent token storage

### Security Hardening (Applied)
- **Helmet**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **CORS**: Configurable via `CORS_ORIGINS` env var, blocks all in production by default
- **Rate Limiting**: Global 100 req/min, auth endpoints stricter (login 10/min, OTP send 3/min)
- **RBAC**: Permission-based access control via PermissionsGuard on all controllers
- **Exception Filter**: Stack traces hidden in production
- **Audit Logging**: All write operations logged to `audit_logs` table with user, IP, action
- **Password Validation**: 8+ chars, uppercase, lowercase, digit
- **OTP Enum**: Purpose restricted to `login/registration/verification/password_reset`
- **No Hardcoded Secrets**: JWT secrets checked in production, psychologist password randomized

### Permission-Based Access Control (RBAC)
- **PermissionsGuard** + `@Permissions()` decorator on all controllers (replaces RolesGuard)
- Permission format: `"resource.action"` (e.g., `users.read`, `content.write`, `system.settings`)
- **SUPERADMIN**: Bypasses all permission checks (hardcoded in guard)
- **ADMIN role**: 25 permissions (users, content, community, communication, meetings, finance, courses, assessments, psychologists[read/write/manage], administrators[read/write/manage], centers)
- **USER role**: 11 permissions (content.read, community, communication, meetings, assessments, psychologists, wellness, finance.write)
- Roles and permissions seeded in DB (`roles` + `permissions` tables)
- `/auth/me` returns `permissions` array (`["*"]` for superadmin, specific list for others)
- Frontend sidebar filters navigation items based on user permissions
- Cross-role access is blocked (superadmin can't access admin panel and vice versa)
- **Privilege escalation blocked**: Only SUPERADMIN can change `role`/`isActive` fields
- **Delete protection**: Cannot delete SUPERADMIN accounts, cannot self-delete

### Route Protection
- Web: Next.js middleware checks cookies, redirects to `/login` if no token
- Web: `skipTrailingSlashRedirect: true` in both Next.js configs — prevents 308 trailing slash redirect that breaks Replit proxy routing
- Web: Middleware matcher `['/(.*)', '/']` catches ALL paths; API and static paths excluded programmatically in middleware body
- Web: AuthProvider validates token on mount, role-checks, auto-refresh
- Mobile: AppNavigator conditionally renders AuthStack vs MainStack based on auth state

### Default Test Credentials (seeded)
- Superadmin: `admin@ruhiyat.uz` / `123456` (primary)
- Superadmin: `superadmin@ruhiyat.uz` / `admin123`
- Admin: `admin@markaz.uz` / `admin123`
- Mobile: `+998901234567` / `user123`

### Security Audit Report
- Full report at `docs/SECURITY_AUDIT.md`

## Dashboard Stats (REAL DATA)
- Superadmin: GET `/api/dashboard/superadmin/stats` — totalUsers, activePsychologists, educationCenters, totalPayments, activeSessions, communityPosts, articles + recentUsers
- Admin: GET `/api/dashboard/admin/stats` — totalStudents, totalTeachers, totalCourses, totalGroups (center-scoped)

## Monorepo Structure

```
apps/
  api/              — @ruhiyat/api (NestJS, port 3000)
  superadmin-web/   — @ruhiyat/superadmin-web (Next.js, artifact: /superadmin/, basePath: /superadmin)
  admin-web/        — @ruhiyat/admin-web (Next.js, artifact: /admin/, basePath: /admin)
  mobile/           — @ruhiyat/mobile (Expo/React Native)
packages/
  types/            — @ruhiyat/types (shared enums, interfaces)
  ui/               — @ruhiyat/ui (shared UI utilities)
  config/           — @ruhiyat/config (shared constants, TOKEN_KEYS)
artifacts/
  superadmin-web/   — Artifact registration (routes to apps/superadmin-web)
  admin-web/        — Artifact registration (routes to apps/admin-web)
  api-server/       — Legacy artifact API server
```

## Superadmin Panel Structure

### Navigation (8 sections, 44+ pages)
- **Asosiy**: Dashboard, Analitika, Hisobotlar, Statistika
- **Foydalanuvchilar**: Users, Psixologlar, Administratorlar, Rollar va ruxsatlar, Kirish nazorati
- **Muloqot**: Chat, Videochat, Hamjamiyat, Sharhlar, E'lonlar
- **Kontent**: Maqolalar CMS, Bannerlar, Bildirishnomalar, Audio, Video, Affirmatsiyalar, Proyektiv metodikalar, Testlar, Treninglar
- **Faoliyat**: Uchrashuvlar, Seanslar tarixi, Faollik jurnali
- **Moderatsiya markazi**: Shikoyatlar, Reportlar, Bloklash, Kontent nazorati
- **Moliya**: To'lovlar, Daromadlar, Tranzaksiyalar, Statistika
- **Tizim**: Sozlamalar, Ilova sozlamalari, Xavfsizlik, Audit loglari, Integratsiyalar, Texnik monitoring, API kalitlar, Access nazorati

### Header
- Sidebar toggle, real date (Uzbek), real clock, live Tashkent weather, refresh button, dark/light toggle, user avatar + name + role dropdown

### Footer
- Project info, social links (Telegram/Instagram/Facebook), address/phone, map placeholder, session info, version (v1.0.0), copyright

### Reusable Components
- `PageHeader` — title, description, icon, badge, action buttons
- `StatsCard` / `StatsGrid` — metric cards with icon, trend, colored accent
- `FilterBar` — search input, dropdown filters, active filter badges
- `EmptyState` — empty data placeholder with icon, title, action
- `ModulePlaceholder` — placeholder for modules under development with feature cards
- `DataTable` — paginated table with search, loading/empty/error states

### Fully Connected Pages (real API data)
- Dashboard, Users (full CRUD + block/unblock/role change), Psychologists (full CRUD + verify/reject + stats), Administrators, Announcements, Articles, Notifications, Meetings, Community, Moderation, Payments, Transactions

## Psychologists Module (Psixologlar)

### Schema
- `Psychologist` model with `VerificationStatus` enum (PENDING/APPROVED/REJECTED)
- Fields: firstName, lastName, specialization, bio, education, certifications[], licenseNumber, experienceYears, verificationStatus, isVerified, isAvailable, rejectionReason, hourlyRate, rating, totalSessions
- Relations: User (1:1), EducationCenter (optional)

### Backend (8 endpoints)
- `GET /api/psychologists` — paginated list with search, status filter, specialization filter, min rating, min experience, sort
- `GET /api/psychologists/stats` — total, approved, pending, rejected counts
- `GET /api/psychologists/:id` — full profile with user/center relations
- `POST /api/psychologists` — creates User+Psychologist in a transaction (or links existing userId)
- `PATCH /api/psychologists/:id` — update profile fields
- `PATCH /api/psychologists/:id/verify` — SUPERADMIN only, sets APPROVED
- `PATCH /api/psychologists/:id/reject` — SUPERADMIN only, sets REJECTED with optional reason
- `DELETE /api/psychologists/:id` — requires psychologists.manage permission
- DTOs: QueryPsychologistsDto, CreatePsychologistDto, UpdatePsychologistDto, RejectPsychologistDto

### Frontend (Superadmin)
- Stats cards: total, approved, pending, rejected
- Filter bar: search + verification status dropdown
- Data table: avatar, name, specialization, experience, rating (stars), status badge, availability badge, date
- Row click → Sheet detail panel with 2x2 stat grid, contact info, certifications badges, bio, rejection reason
- Action menu: view, edit, verify, reject, delete
- Create dialog: full form with name, email/phone, specialization, education, license, experience, rate, certifications (tag input), bio
- Edit dialog: all editable fields including certifications tag input
- Verify confirmation (AlertDialog), Reject with reason (Dialog), Delete confirmation (AlertDialog)

## Administrators Module (Administratorlar)

### Schema
- `Administrator` model: id, userId (unique), centerId, firstName, lastName, position, invitedBy
- Each Administrator links to exactly one `EducationCenter`
- `EducationCenter` has `subscriptionPlan: SubscriptionPlan` enum (BASIC/PREMIUM, default BASIC)

### Backend (8 endpoints)
- `GET /api/administrators` — paginated list with search, status (active/inactive), plan (BASIC/PREMIUM), sort
- `GET /api/administrators/stats` — total, active, inactive, premium counts
- `GET /api/administrators/:id` — full profile with user/center/counts
- `POST /api/administrators` — creates User+Center+Administrator in transaction (or links existing userId)
- `PATCH /api/administrators/:id` — update admin/center profile (no isActive - separate endpoints)
- `PATCH /api/administrators/:id/activate` — administrators.manage permission, activates center
- `PATCH /api/administrators/:id/deactivate` — administrators.manage permission, deactivates center
- `DELETE /api/administrators/:id` — SUPERADMIN only
- DTOs: QueryAdministratorsDto, CreateAdministratorDto, UpdateAdministratorDto

### Frontend (Superadmin)
- Stats cards: total centers, active, inactive, premium
- Filter bar: search + status dropdown + plan dropdown
- Data table: center avatar, center name (with student/teacher counts), admin name/email, phone, plan badge, status badge, date
- Row click → Sheet detail panel with center stats (students, teachers, courses), contact info, description
- Action menu: view, edit, activate/deactivate, delete
- Create dialog: admin info (name, email/phone, position) + center info (name, phone, email, address, plan, description)
- Edit dialog: all editable fields
- Activate/Deactivate confirmation (AlertDialog), Delete confirmation (AlertDialog)

### Placeholder Pages (UI ready, awaiting backend)
- Analytics, Reports, Statistics, Roles, Access Control, Chat, Videochat, Reviews, Banners, Audio, Videos, Affirmations, Projective Methods, Tests, Trainings, Sessions History, Activity Logs, Complaints, Reports Moderation, Blocking, Content Control, Finance Statistics, Revenue, Settings, App Settings, Security, Audit Logs, Integrations, Monitoring, API Keys, System Access

### Admin Web (11 real data pages, center-scoped)
- Students, Teachers, Courses, Groups, Announcements, Notifications, Meetings, Payments, Psychologists, Staff, Transactions
- Center-scoped pages use `useAuth()` → `user.administrator.centerId` for `/education-centers/:id/*` endpoints
- Create dialogs: Students, Teachers, Courses, Groups, Announcements

### Mobile (5 real data screens)
- HomeScreen: Real articles, announcements, mood tracking via API
- CommunityScreen: Real community posts with pull-to-refresh
- PsychologyScreen: Real psychologist listing
- ContentScreen: Real articles listing
- ProfileScreen: Real stats from mood/test-results endpoints

### Shared Components
- `DataTable` component in both web panels: paginated table with search, loading states, header actions
- `apiClient` in both web panels + mobile: auto auth headers, token refresh, 401 redirect

## Key Files

### Auth Infrastructure
- `apps/api/src/auth/auth.controller.ts` — Auth endpoints with DTOs
- `apps/api/src/auth/auth.service.ts` — Auth logic, token generation, OTP
- `apps/api/src/auth/dto/` — Validated DTOs (LoginDto, RegisterDto, etc.)
- `apps/api/src/auth/guards/` — JwtAuthGuard, PermissionsGuard (primary), RolesGuard (legacy)
- `apps/api/src/auth/decorators/permissions.decorator.ts` — @Permissions decorator
- `apps/api/src/auth/strategies/jwt.strategy.ts` — JWT validation
- `apps/api/src/system/dashboard.controller.ts` — Dashboard stats endpoints
- `apps/api/src/seed.ts` — Database seeder (creates default users)

### Web Panel Auth
- `apps/superadmin-web/src/lib/auth.ts` — Auth API calls, token storage
- `apps/superadmin-web/src/components/auth-provider.tsx` — AuthProvider + useAuth hook
- `apps/superadmin-web/src/middleware.ts` — Route protection middleware
- `apps/admin-web/src/lib/auth.ts` — Same pattern for admin
- `apps/admin-web/src/components/auth-provider.tsx` — Admin AuthProvider
- `apps/admin-web/src/middleware.ts` — Admin route protection

### Mobile Auth
- `apps/mobile/src/services/api.ts` — API client with auto-refresh
- `apps/mobile/src/services/auth.ts` — Auth service (login, register, OTP)
- `apps/mobile/src/contexts/AuthContext.tsx` — Auth state + SecureStore persistence
- `apps/mobile/src/navigation/AppNavigator.tsx` — Auth-gated navigation

## Key Commands

- `pnpm --filter @ruhiyat/api run dev` — API (port 3000)
- `pnpm --filter @ruhiyat/superadmin-web run dev` — Superadmin (artifact port 18343, preview: /superadmin/)
- `pnpm --filter @ruhiyat/admin-web run dev` — Admin (artifact port 24276, preview: /admin/)
- `cd apps/api && npx ts-node --transpile-only src/seed.ts` — Seed database
- `cd apps/api && npx prisma db push` — Push schema
- `cd apps/api && npx prisma studio` — Prisma Studio

## Database

52 Prisma models at `apps/api/prisma/schema.prisma` (User model now has firstName/lastName columns).

## Production Deployment

- **Production server**: API only (`apps/api` / `@ruhiyat/api`) — single NestJS process
- **Production build**: `pnpm --filter @ruhiyat/api run build` → `apps/api/dist/main.js`
- **Production run**: `node --enable-source-maps apps/api/dist/main.js` on `process.env.PORT`
- **Health check**: `GET /api/healthz` → `{"status":"ok"}`
- **Web panels**: Deployed separately (e.g. Vercel), NOT in Replit production
- **CORS**: Configure `CORS_ORIGINS` env var with comma-separated allowed origins for web panels

## Stack

- **Monorepo**: pnpm workspaces
- **API**: NestJS 11 + Prisma + PostgreSQL (NO Express, NO Drizzle)
- **Web panels**: Next.js 15 + Tailwind CSS v4 + shadcn/ui (NO Vite)
- **Mobile**: React Native 0.79 + Expo SDK 53 (Android-first)
- **Auth**: JWT + bcryptjs + Passport + expo-secure-store
- **Security**: Helmet + @nestjs/throttler + Global exception filter + Audit logging interceptor
