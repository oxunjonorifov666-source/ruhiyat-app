# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

pnpm workspace monorepo for "Ruhiyat" — a digital mental wellness platform with four products:
1. **Superadmin Web Panel** (`apps/superadmin-web`) — platform-wide management (Next.js + TypeScript + Tailwind CSS + shadcn/ui) [planned]
2. **Administrator Web Panel** (`apps/admin-web`) — education center management (Next.js + TypeScript + Tailwind CSS + shadcn/ui) [planned]
3. **Mobile App** (`apps/mobile`) — end-user wellness app (React Native + Expo, Android-first) [planned]
4. **Backend API** (`apps/api`) — NestJS + Prisma + PostgreSQL backend serving all clients

## Monorepo Structure

```
apps/
  api/              — @ruhiyat/api (NestJS backend, port 3000)
  superadmin-web/   — @ruhiyat/superadmin-web (Next.js) [placeholder]
  admin-web/        — @ruhiyat/admin-web (Next.js) [placeholder]
  mobile/           — @ruhiyat/mobile (Expo/React Native) [placeholder]
packages/
  types/            — @ruhiyat/types (shared enums, interfaces)
  ui/               — @ruhiyat/ui (shared UI utilities, cn())
  config/           — @ruhiyat/config (shared constants)
artifacts/
  api-server/       — Legacy Replit artifact (duplicate of apps/api, managed by Replit)
  mockup-sandbox/   — Canvas component preview server
```

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.8
- **API framework**: NestJS 11
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (access + refresh tokens), bcryptjs, OTP, Passport
- **Validation**: class-validator, class-transformer
- **Web panels**: Next.js 15 + Tailwind CSS + shadcn/ui
- **Mobile**: React Native + Expo (Android-first, APK/AAB-ready)
- **Build**: NestJS CLI (API), Next.js (web), Expo (mobile)

## Database Schema

Prisma schema at `apps/api/prisma/schema.prisma` with 52 models organized by domain:
- **Auth & Identity**: User, Role, Permission, Session, OtpVerification
- **Profiles**: Superadmin, Administrator, MobileUser, Psychologist, Teacher, Staff, Student, EducationCenter
- **Education**: Course, Group, Enrollment
- **Assessments**: Test, Question, Answer, TestResult
- **Communication**: Chat, ChatParticipant, Message, Notification, Announcement
- **Community**: CommunityPost, Comment, Complaint, ModerationAction
- **Content**: Article, Banner, AudioContent, VideoContent, Affirmation, ProjectiveMethod, Training
- **Meetings**: Meeting, MeetingParticipant
- **Finance**: Payment, Transaction, RevenueRecord
- **System**: AuditLog, SystemSetting, MobileAppSetting, ApiKey, IntegrationSetting
- **Wellness**: MoodEntry, DiaryEntry, Habit, HabitLog, SleepRecord, BreathingSession, SavedItem

## NestJS Modules (16 modules, 100+ endpoints)

Domain-based modules in `apps/api/src/`:
- `auth/` — JWT auth, OTP, password reset, guards, decorators
- `users/` — user CRUD & sessions
- `roles/` — roles & permissions (RBAC)
- `psychologists/` — psychologist profiles
- `education-centers/` — center CRUD + sub-resources (staff, students, teachers, courses)
- `courses/` — courses, groups, enrollments
- `assessments/` — tests, questions, answers, results
- `communication/` — chats, messages, notifications, announcements
- `community/` — posts, comments, complaints, moderation
- `content/` — articles, banners, audio, video, affirmations, projective methods, trainings
- `meetings/` — meeting scheduling & participation
- `finance/` — payments, transactions, revenue
- `system/` — settings, audit logs, API keys, integrations
- `wellness/` — mood, diary, habits, sleep, breathing, saved items
- `health/` — health check endpoint
- `prisma/` — global Prisma database service

## Auth Guards & Decorators

- `JwtAuthGuard` — JWT bearer token authentication
- `RolesGuard` — role-based access control
- `@Roles('SUPERADMIN', 'ADMINISTRATOR')` — role requirement decorator
- `@CurrentUser()` — extract current user from request

## Roles

- **SUPERADMIN**: full platform access (email + password + optional 2FA)
- **ADMINISTRATOR**: center-scoped access (invite-only, email/phone + password)
- **MOBILE_USER**: personal wellness features (phone + OTP, optional PIN/biometric)

## Shared Packages

- `@ruhiyat/types` — UserRole, ComplaintStatus, PaymentStatus, MeetingStatus, AuthTokens, ApiResponse, PaginatedResponse
- `@ruhiyat/ui` — `cn()` utility (clsx + tailwind-merge)
- `@ruhiyat/config` — API_BASE_URL, TOKEN_KEYS, ROLES, PAGINATION_DEFAULTS

## Key Commands

- `pnpm install` — install all dependencies
- `pnpm --filter @ruhiyat/api run dev` — run NestJS API in watch mode
- `pnpm --filter @ruhiyat/api run build` — build NestJS API
- `cd apps/api && npx prisma generate` — generate Prisma client
- `cd apps/api && npx prisma db push` — push schema to database
- `cd apps/api && npx prisma studio` — open Prisma Studio

## API Base URL

All endpoints prefixed with `/api/` (e.g., `/api/auth/login`, `/api/users`, `/api/healthz`)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret (defaults to dev value)
- `JWT_REFRESH_SECRET` — JWT refresh token secret (defaults to dev value)
- `SESSION_SECRET` — session secret
- `PORT` — API server port (defaults to 3000)

## Security

- Refresh tokens stored as SHA-256 hashes in database
- JWT secrets fail-fast in production if missing
- Rate limiting via @nestjs/throttler
- Input validation via class-validator with whitelist mode
