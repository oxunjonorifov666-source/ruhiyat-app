# Ruhiyat - Architecture Documentation

## Overview

Ruhiyat is a digital mental wellness ecosystem consisting of three major products:

1. **Superadmin Web Panel** - Platform-wide management and monitoring
2. **Administrator Web Panel** - Education center management for owners/managers
3. **Mobile App** - End-user mental wellness app (React Native / Expo, Android-first)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Backend API | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| API Style | REST |
| Auth | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Web Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Mobile | React Native + Expo + TypeScript |
| API Codegen | Orval (from OpenAPI spec) |
| Build | esbuild (API), Vite (web), Expo (mobile) |

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express API backend (shared across all clients)
│   │   ├── src/
│   │   │   ├── routes/      # Domain-based route modules
│   │   │   │   ├── auth/          # Authentication & authorization
│   │   │   │   ├── users/         # User management
│   │   │   │   ├── roles/         # Roles & permissions CRUD
│   │   │   │   ├── psychologists/ # Psychologist management
│   │   │   │   ├── education-centers/  # Center CRUD + sub-resources
│   │   │   │   ├── courses/       # Courses, groups, enrollments
│   │   │   │   ├── assessments/   # Tests, questions, results
│   │   │   │   ├── communication/ # Chats, messages, notifications, announcements
│   │   │   │   ├── community/     # Posts, comments, complaints, moderation
│   │   │   │   ├── content/       # Articles, banners, audio, video, affirmations, trainings
│   │   │   │   ├── meetings/      # Meeting scheduling & management
│   │   │   │   ├── finance/       # Payments, transactions, revenue
│   │   │   │   ├── system/        # Audit logs, settings, API keys, integrations
│   │   │   │   ├── wellness/      # Mood, diary, habits, sleep, breathing
│   │   │   │   └── health.ts      # Health check endpoint
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts        # JWT authentication & role-based authorization
│   │   │   │   ├── audit.ts       # Audit logging middleware
│   │   │   │   └── rate-limit.ts  # Rate limiting middleware
│   │   │   └── lib/
│   │   │       └── logger.ts      # Structured logging (pino)
│   │   └── package.json
│   │
│   ├── superadmin-web/      # Superadmin web panel (React + Vite) [TO BE CREATED]
│   ├── admin-web/           # Administrator web panel (React + Vite) [TO BE CREATED]
│   ├── mobile/              # Mobile app (Expo / React Native) [TO BE CREATED]
│   └── mockup-sandbox/      # Design prototyping sandbox
│
├── lib/
│   ├── db/                  # Database schema & client (Drizzle ORM)
│   │   └── src/schema/      # Domain-organized schema files
│   │       ├── users.ts         # users, roles, permissions
│   │       ├── sessions.ts      # sessions, otp_verifications
│   │       ├── profiles.ts      # superadmins, administrators, mobile_users,
│   │       │                    # education_centers, psychologists, teachers,
│   │       │                    # staff, students
│   │       ├── education.ts     # courses, groups, enrollments
│   │       ├── assessments.ts   # tests, questions, answers, test_results
│   │       ├── communication.ts # chats, messages, notifications, announcements
│   │       ├── community.ts     # community_posts, comments, complaints,
│   │       │                    # moderation_actions
│   │       ├── content.ts       # articles, banners, audio_content, video_content,
│   │       │                    # affirmations, projective_methods, trainings
│   │       ├── meetings.ts      # meetings, meeting_participants
│   │       ├── finance.ts       # payments, transactions, revenue_records
│   │       ├── system.ts        # audit_logs, system_settings, mobile_app_settings,
│   │       │                    # api_keys, integration_settings
│   │       └── wellness.ts      # mood_entries, diary_entries, habits, habit_logs,
│   │                            # sleep_records, breathing_sessions, saved_items
│   ├── api-spec/            # OpenAPI specification (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod validation schemas
│
├── scripts/                 # Utility scripts
└── package.json             # Root workspace configuration
```

---

## Roles & Access Control

| Role | Access | Auth Method |
|------|--------|-------------|
| Superadmin | Full platform access, all modules | Email + password + optional 2FA |
| Administrator | Education center scoped access | Invite-only, email/phone + password |
| Mobile User | Personal wellness features | Phone + OTP, optional PIN/biometric |

### Role-Based Access Control (RBAC)

- Roles are stored in the `roles` table with associated `permissions`
- Each permission links a role to a resource + action pair
- Auth middleware validates JWT tokens and checks role/permissions
- Guards are applied at the route level using the `authorize()` middleware

---

## Authentication Strategy

### Superadmin Flow
1. Login with email + password (bcrypt-hashed)
2. JWT access token (short-lived, 15 min) + refresh token (7 days)
3. 2FA structure ready (TOTP-based, stored in `superadmins.two_factor_secret`)
4. Active sessions tracked in `sessions` table

### Administrator Flow
1. Invite-only account creation (invited by superadmin or existing admin)
2. Login with email/phone + password
3. JWT access/refresh token pair
4. Scoped to their education center

### Mobile User Flow
1. Register/login with phone number
2. OTP verification (code stored in `otp_verifications` with expiry)
3. JWT access/refresh token pair
4. Optional PIN and biometric authentication ready

### Security Features
- bcrypt password hashing (cost factor 12)
- JWT access tokens (15 min expiry)
- Refresh tokens (7 days, stored in `sessions`, revocable)
- OTP codes with expiration and attempt limits
- Rate limiting on auth endpoints
- Session tracking with device info and IP
- Audit logging for all sensitive operations
- No secrets in code (all via environment variables)

---

## Database Schema Plan

### Auth & Identity (4 tables)
- `users` - Base user table with role enum (superadmin/administrator/mobile_user)
- `roles` - Custom roles for fine-grained permissions
- `permissions` - Resource + action pairs linked to roles
- `sessions` - Active sessions with refresh tokens

### Verification (1 table)
- `otp_verifications` - OTP codes for phone/email verification

### Profile & Organization (8 tables)
- `superadmins` - Superadmin profiles with 2FA settings
- `administrators` - Admin profiles linked to education centers
- `mobile_users` - End-user profiles with premium/biometric settings
- `education_centers` - Education institutions
- `psychologists` - Professional profiles with ratings
- `teachers` - Teacher records per center
- `staff` - General staff per center
- `students` - Student records per center

### Education (3 tables)
- `courses` - Courses offered by centers
- `groups` - Student groups within courses
- `enrollments` - Student enrollment tracking

### Assessments (4 tables)
- `tests` - Psychological and educational tests
- `questions` - Test questions with ordering
- `answers` - Answer options with scoring
- `test_results` - User test results with interpretation

### Communication (5 tables)
- `chats` - Chat rooms (direct/group/support)
- `chat_participants` - Chat membership
- `messages` - Chat messages with attachments
- `notifications` - Push/in-app notifications
- `announcements` - System/center-wide announcements

### Community (4 tables)
- `community_posts` - User-generated content
- `comments` - Post comments (threaded)
- `complaints` - User complaints/reports
- `moderation_actions` - Moderator actions on content

### Content (7 tables)
- `articles` - CMS articles with slugs and tags
- `banners` - Promotional banners
- `audio_content` - Audio library items
- `video_content` - Video library items
- `affirmations` - Daily affirmation cards
- `projective_methods` - Psychological projection tools
- `trainings` - Training/exercise content

### Meetings (2 tables)
- `meetings` - Scheduled meetings with video links
- `meeting_participants` - Meeting attendance tracking

### Finance (3 tables)
- `payments` - Payment records with provider integration
- `transactions` - Financial transaction log
- `revenue_records` - Revenue tracking per center/source

### System (4 tables)
- `audit_logs` - Comprehensive audit trail
- `system_settings` - Platform configuration
- `mobile_app_settings` - Mobile app configuration
- `api_keys` - API key management
- `integration_settings` - Third-party integration config

### Wellness (7 tables)
- `mood_entries` - Mood tracking with factors
- `diary_entries` - Personal diary/journal
- `habits` - Habit definitions
- `habit_logs` - Habit completion tracking
- `sleep_records` - Sleep quality tracking
- `breathing_sessions` - Breathing exercise logs
- `saved_items` - Bookmarked/saved content

**Total: 52 tables**

---

## Backend Module Map

Each route module is a self-contained Express router with domain-specific endpoints:

| Module | Base Path | Key Endpoints |
|--------|-----------|--------------|
| Auth | `/api/auth` | login, register, refresh, logout, OTP, password reset |
| Users | `/api/users` | CRUD, sessions |
| Roles | `/api/roles` | CRUD, permissions management |
| Psychologists | `/api/psychologists` | CRUD, availability |
| Education Centers | `/api/education-centers` | CRUD + staff/students/teachers/courses |
| Courses | `/api/courses, /api/groups, /api/enrollments` | CRUD for education |
| Assessments | `/api/tests, /api/test-results` | CRUD, submissions |
| Communication | `/api/chats, /api/notifications, /api/announcements` | Messaging |
| Community | `/api/community, /api/complaints, /api/moderation` | Social features |
| Content | `/api/articles, /api/banners, /api/audio, /api/videos, etc.` | CMS |
| Meetings | `/api/meetings` | Scheduling, join/leave |
| Finance | `/api/payments, /api/transactions, /api/revenue` | Payments |
| System | `/api/audit-logs, /api/settings, /api/api-keys` | Platform config |
| Wellness | `/api/mood, /api/diary, /api/habits, /api/sleep, etc.` | Tracking |

---

## Superadmin Panel Modules

| Category | Modules |
|----------|---------|
| Overview | Dashboard, Analytics, Reports, Statistics |
| User Management | Users, Psychologists, Administrators, Roles & Permissions |
| Communication | Chat, Videochat, Notifications, Announcements |
| Community | Community, Reviews |
| Content | Articles CMS, Banners, Audio Library, Video Library |
| Wellness | Affirmations, Projective Methods, Psychological Tests |
| Education | Trainings, Meetings, Session History |
| Moderation | Complaints, Reports, Blocking, Content Control |
| Finance | Payments, Revenue, Transactions |
| System | Settings, Mobile App Settings, Security, Audit Logs |
| Technical | Integrations, API Keys, Technical Monitoring, Access Control |
| Activity | Activity Logs |

---

## Administrator Panel Modules

| Category | Modules |
|----------|---------|
| Overview | Dashboard, Reports, Statistics |
| People | Students, Teachers, Psychologists, Staff |
| Education | Courses, Groups |
| Assessment | Tests, Result Analytics |
| Communication | Chat, Notifications, Meetings, Announcements |
| Finance | Payments, Revenue, Transactions |
| System | Center Settings, Staff Roles, Security, Audit Logs, Integrations |

---

## Mobile App Navigation

| Tab | Features |
|-----|----------|
| Home | Mood tracking, quick actions, upcoming meetings, progress, recommendations |
| Psychology | Psychologists, AI psychologist, chat, videochat, session history |
| Development | Diary, habits, sleep, breathing, tests, results, progress |
| Content | Articles, audio, video, affirmations, projective methods, trainings, saved |
| Community | Posts, comments, complaint/report submission |
| Messages | Notifications, announcements, reminders |
| Market | Services, premium, payments, payment history |
| Profile | Profile settings, security, privacy, activity history, logout |

---

## Next Steps

1. **Implement auth flows** - Complete JWT token generation, bcrypt hashing, OTP logic
2. **Build OpenAPI specification** - Define all API contracts for codegen
3. **Create frontend artifacts** - Scaffold superadmin, admin, and mobile apps
4. **Implement core CRUD routes** - Wire up database queries in route handlers
5. **Add real-time features** - WebSocket for chat and notifications
6. **Integrate payment provider** - Connect payment gateway
7. **Add file storage** - Object storage for media content
