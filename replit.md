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