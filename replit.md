# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

Ruhiyat is a pnpm workspace monorepo project aimed at developing a comprehensive digital mental wellness platform. The platform is designed to provide mental health support and resources through various interfaces. The primary goal is to create an "Uzbek-first" UI experience across all applications.

Key components of the ecosystem include:
- A Superadmin Web Panel for high-level management and oversight.
- An Administrator Web Panel for managing education centers and related entities.
- A Mobile App for end-users to access mental wellness services.
- A Backend API serving all applications with robust authentication and data management.

The project emphasizes strong authentication, role-based access control (RBAC), and a secure, scalable architecture to deliver a reliable mental wellness solution.

## User Preferences

No specific user preferences were provided in the original document.

## System Architecture

The Ruhiyat project is built as a pnpm monorepo, encompassing several applications and shared packages.

### UI/UX Decisions
- **Language**: All UI is Uzbek-first.
- **Web Panels**: Utilize Next.js, Tailwind CSS, and shadcn/ui for consistent and modern design.
- **Mobile App**: Developed with Expo and React Native, prioritizing an Android-first experience.

### Technical Implementations
- **Authentication**: JWT-based authentication with access and refresh tokens, bcryptjs for password hashing, and Passport. Refresh tokens are stored as SHA-256 hashes. Mobile app uses `expo-secure-store` for token persistence.
- **Authorization**: Implements a robust Permission-Based Access Control (RBAC) system using `@Permissions()` decorators and `PermissionsGuard` on API controllers. Permissions are granular (`resource.action`).
- **Security**: Comprehensive security measures including Helmet for HTTP headers, configurable CORS, rate limiting, exception filtering, and audit logging for all write operations. Password validation and OTP purpose restriction are also in place.
- **Data Management**: PostgreSQL database managed via Prisma ORM.
- **API**: Built with NestJS, providing over 100 endpoints across 16 modules.
- **Frontend Routing**: Next.js middleware handles route protection and redirection. Mobile navigation is conditionally rendered based on authentication state.
- **Shared Components**: Reusable UI components like `DataTable`, `PageHeader`, `StatsCard`, `FilterBar`, and `EmptyState` are used across web panels for consistency. An `apiClient` ensures standardized API interaction and token management.

### Feature Specifications
- **Superadmin Web Panel**: Features 8 navigation sections and 44+ pages, including dashboards, user management (Superadmins, Psychologists, Administrators), communication tools, content management (articles, banners, notifications), activity tracking, moderation center (complaints, reports, blocking, content control), finance, and system settings. Psychologists and Administrators modules include full CRUD functionality, verification workflows, and center management. Moderation Center includes 4 sub-modules: Shikoyatlar (complaints with assign/resolve/reject), Reportlar (moderation reports), Bloklash (user/psychologist blocking with history), Kontent nazorati (content moderation with approve/reject/hide).
- **Administrator Web Panel**: Offers 23 modules, focused on center-scoped data for students, teachers, courses, groups, and financial transactions.
- **Mobile App**: Includes screens for articles, announcements, mood tracking, community posts, psychologist listings, and user profiles.

### System Design Choices
- **Monorepo**: Facilitates code sharing and management across multiple applications.
- **Microservices-like (Logical Separation)**: Separate applications for superadmin, admin, mobile, and API, allowing for independent development and deployment.
- **Database Seeding**: `seed.ts` script for populating the database with initial data and default credentials.
- **Health Checks**: `/api/healthz` endpoint for API status monitoring.

## External Dependencies

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Frontend Frameworks**: Next.js, React Native, Expo
- **UI Libraries**: Tailwind CSS, shadcn/ui
- **Authentication Libraries**: Passport.js, bcryptjs, `expo-secure-store`
- **Backend Framework**: NestJS
- **Real-time Communication**: Socket.IO (via @nestjs/websockets, @nestjs/platform-socket.io)

## Communication Module (Muloqot)

### Backend
- **WebSocket Gateway**: `ChatGateway` at `/chat` namespace with JWT auth, real-time messaging, typing indicators, read status tracking, online user presence
- **REST Endpoints**: Chat management (`/api/chats`, `/api/chat/stats`), Video sessions (`/api/video/sessions`, `/api/video/stats`, `/api/video/schedule`), Notifications, Announcements
- **Key Files**: `apps/api/src/communication/chat.gateway.ts`, `communication.service.ts`, `communication.controller.ts`, `communication.module.ts`

### Frontend (Superadmin)
- **Chat Page** (`/chat`): Stats cards (total/active chats, total/today messages), pie chart, filterable chat list with type/status filters, detail sheet with participant list and message history, toggle active/inactive, CSV export
- **Videochat Page** (`/videochat`): Stats cards (total/scheduled/active/completed sessions), pie chart, filterable session list with status/type/date filters, detail sheet with host/participant info, start/end/cancel actions, CSV export

## Sessions Module (Booking System)

### Database
- **BookingSession** model with enums `BookingStatus` (PENDING/ACCEPTED/REJECTED/COMPLETED/CANCELLED) and `BookingPaymentStatus` (UNPAID/PAID/REFUNDED)
- Relations to User, Psychologist, Meeting, Chat; mapped to `booking_sessions` table

### Backend
- **REST Endpoints**: `/api/sessions` (stats, CRUD, state transitions), `/api/sessions/user` (user's own sessions), `/api/sessions/psychologist` (psychologist's own sessions)
- **State Machine**: PENDING→ACCEPTED/REJECTED/CANCELLED, ACCEPTED→COMPLETED/CANCELLED
- **Integrations on Accept**: Creates Meeting (with URL) + Chat (with participants) in a single transaction
- **Integrations on Cancel (paid)**: Creates REFUND transaction, sets paymentStatus=REFUNDED
- **Integrations on Complete**: Meeting status→COMPLETED, Psychologist totalSessions incremented
- **RBAC**: `sessions.read` (list/stats/detail), `sessions.write` (create), `sessions.manage` (accept/reject/cancel/complete)
- **Key Files**: `apps/api/src/sessions/sessions.service.ts`, `sessions.controller.ts`, `sessions.module.ts`

### Frontend (Superadmin)
- **Sessions Page** (`/sessions`): 6 stats cards (total/pending/accepted/completed/today/revenue), pie chart, filterable table with status/payment/date filters, detail sheet with user+psychologist info + meeting/chat details, action buttons (accept/reject/cancel/complete) with AlertDialog confirmation, CSV export
- **Navigation**: Added under "Faoliyat" section with CalendarCheck icon

## Product Polish & UX Improvements

### Toast Notifications
- **Sonner** integrated as global toast system in dashboard layout
- Sessions page actions use `toast.success/error` instead of `alert()`
- Rich toasts with descriptions for errors

### Notification System
- **Notification bell** in header with unread count badge (animated pulse)
- Dropdown showing recent notifications with mark-as-read
- Auto-polls every 30 seconds for new notifications
- Scoped to current user (security-fixed: userId from JWT, ownership check on mark-read)

### Dashboard Improvements
- **Real bar chart** (recharts) showing user registration growth over last 6 months
- **Booking session stats row**: total/pending/completed/revenue from real API
- **Real activity feed**: populated from audit logs with action/resource labels and user names
- **Enhanced API**: `GET /api/dashboard/superadmin/stats` returns monthlyGrowth, bookings, recentActivity
- **Animated numbers**: count-up animation on stat values
- **Full skeleton loading**: every section has proper skeleton placeholders

### UI Quality
- **StatsCard**: hover shadow + scale animation, `loading` prop for skeleton state, supports JSX `value`
- **DataTable**: debounced auto-search, improved empty state with icon, dark mode error styling, table header background
- **PageHeader**: accepts both array-based and JSX-based `actions` prop
- **Skeleton loaders**: stats cards, charts, user lists, activity feed

### Performance
- **`useApiData` hook**: reusable data fetching with loading/error/refresh states, auto-refresh interval, race condition protection
- **`useDebounce` hook**: 400ms debounced search to reduce API calls
- **Dashboard auto-refresh**: stats refresh every 60 seconds

### Custom Hooks
- `apps/superadmin-web/src/hooks/use-api-data.ts` — data fetching with caching, auto-refresh, race conditions
- `apps/superadmin-web/src/hooks/use-debounce.ts` — value debouncing utility