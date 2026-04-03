# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

pnpm workspace monorepo for "Ruhiyat" — a digital mental wellness platform with three products:
1. **Superadmin Web Panel** — platform-wide management (React + Vite) [planned]
2. **Administrator Web Panel** — education center management (React + Vite) [planned]
3. **Mobile App** — end-user wellness app (Expo / React Native) [planned]
4. **API Server** — shared NestJS backend serving all clients

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: NestJS 11
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (access + refresh tokens), bcryptjs, OTP, Passport
- **Validation**: class-validator, class-transformer
- **Build**: NestJS CLI (API), Vite (web), Expo (mobile)

## Database Schema

Prisma schema at `artifacts/api-server/prisma/schema.prisma` with 50+ models organized by domain:
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

## NestJS Modules

Domain-based modules in `artifacts/api-server/src/`:
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

## Key Commands

- `pnpm install` — install all dependencies
- `pnpm --filter @workspace/api-server run dev` — run NestJS API in watch mode
- `pnpm --filter @workspace/api-server run build` — build NestJS API
- `cd artifacts/api-server && npx prisma generate` — generate Prisma client
- `cd artifacts/api-server && npx prisma db push` — push schema to database
- `cd artifacts/api-server && npx prisma studio` — open Prisma Studio

## API Base URL

All endpoints prefixed with `/api/` (e.g., `/api/auth/login`, `/api/users`, `/api/healthz`)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret (defaults to dev value)
- `JWT_REFRESH_SECRET` — JWT refresh token secret (defaults to dev value)
- `PORT` — API server port (defaults to 3000, workflow uses 8080)
