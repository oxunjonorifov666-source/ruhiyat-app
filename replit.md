# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

pnpm workspace monorepo for "Ruhiyat" — a digital mental wellness platform with three products:
1. **Superadmin Web Panel** — platform-wide management (React + Vite) [planned]
2. **Administrator Web Panel** — education center management (React + Vite) [planned]
3. **Mobile App** — end-user wellness app (Expo / React Native) [planned]
4. **API Server** — shared Express backend serving all clients

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Authentication**: JWT (access + refresh tokens), bcryptjs, OTP
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API), Vite (web), Expo (mobile)

## Database Schema

52 tables organized by domain in `lib/db/src/schema/`:
- `users.ts` — users, roles, permissions (auth & identity)
- `sessions.ts` — sessions, otp_verifications
- `profiles.ts` — superadmins, administrators, mobile_users, education_centers, psychologists, teachers, staff, students
- `education.ts` — courses, groups, enrollments
- `assessments.ts` — tests, questions, answers, test_results
- `communication.ts` — chats, chat_participants, messages, notifications, announcements
- `community.ts` — community_posts, comments, complaints, moderation_actions
- `content.ts` — articles, banners, audio_content, video_content, affirmations, projective_methods, trainings
- `meetings.ts` — meetings, meeting_participants
- `finance.ts` — payments, transactions, revenue_records
- `system.ts` — audit_logs, system_settings, mobile_app_settings, api_keys, integration_settings
- `wellness.ts` — mood_entries, diary_entries, habits, habit_logs, sleep_records, breathing_sessions, saved_items

## Backend Route Modules

Domain-based route modules in `artifacts/api-server/src/routes/`:
- `auth/` — authentication, OTP, password reset
- `users/` — user CRUD & sessions
- `roles/` — roles & permissions
- `psychologists/` — psychologist management
- `education-centers/` — center CRUD + sub-resources
- `courses/` — courses, groups, enrollments
- `assessments/` — tests & results
- `communication/` — chats, notifications, announcements
- `community/` — posts, comments, moderation
- `content/` — articles, banners, audio, video, affirmations, etc.
- `meetings/` — meeting scheduling
- `finance/` — payments, transactions, revenue
- `system/` — settings, audit logs, API keys
- `wellness/` — mood, diary, habits, sleep, breathing

## Middleware

- `auth.ts` — JWT authentication + role-based authorization guards
- `audit.ts` — audit logging hooks
- `rate-limit.ts` — in-memory rate limiting

## Roles

- **Superadmin**: full platform access (email + password + optional 2FA)
- **Administrator**: center-scoped access (invite-only, email/phone + password)
- **Mobile User**: personal wellness features (phone + OTP, optional PIN/biometric)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

See `ARCHITECTURE.md` for full architecture documentation including database schema plan, module map, and authentication strategy.
