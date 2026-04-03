# Ruhiyat - Digital Mental Wellness Ecosystem

## Overview

pnpm workspace monorepo for "Ruhiyat" — a digital mental wellness platform. **All UI is Uzbek-first.**

1. **Superadmin Web Panel** (`apps/superadmin-web`) — 37 modules, premium dashboard (Next.js + Tailwind + shadcn/ui)
2. **Administrator Web Panel** (`apps/admin-web`) — 23 modules, center management (Next.js + Tailwind + shadcn/ui)
3. **Mobile App** (`apps/mobile`) — 12 screens, 5-tab navigation (Expo + React Native, Android-first)
4. **Backend API** (`apps/api`) — 16 NestJS modules, 100+ endpoints (NestJS + Prisma + PostgreSQL)

## Monorepo Structure

```
apps/
  api/              — @ruhiyat/api (NestJS, port 3000)
  superadmin-web/   — @ruhiyat/superadmin-web (Next.js, port 3100)
  admin-web/        — @ruhiyat/admin-web (Next.js, port 3200)
  mobile/           — @ruhiyat/mobile (Expo/React Native)
packages/
  types/            — @ruhiyat/types (shared enums, interfaces)
  ui/               — @ruhiyat/ui (shared UI utilities)
  config/           — @ruhiyat/config (shared constants)
```

## Stack

- **Monorepo**: pnpm workspaces
- **API**: NestJS 11 + Prisma + PostgreSQL
- **Web panels**: Next.js 15 + Tailwind CSS v4 + shadcn/ui (new-york style)
- **Mobile**: React Native 0.79 + Expo SDK 53 (Android-first, APK/AAB-ready)
- **Auth**: JWT (access + refresh), bcryptjs, OTP, Passport
- **Language**: All UI in Uzbek (code in English)

## Superadmin Modules (37 pages)

Boshqaruv paneli, Analitika, Hisobotlar, Statistika, Foydalanuvchilar, Psixologlar, Administratorlar, Rollar va ruxsatlar, Kirish nazorati, Chat, Videochat, Bildirishnomalar, E'lonlar, Hamjamiyat, Sharhlar, Moderatsiya markazi, Maqolalar CMS, Bannerlar, Audio kutubxona, Video kutubxona, Afirmatsiyalar, Proyektiv metodikalar, Psixologik testlar, Treninglar, Uchrashuvlar, Seanslar tarixi, To'lovlar, Daromadlar, Tranzaksiyalar, Sozlamalar, Mobil ilova sozlamalari, Xavfsizlik, Audit loglari, Faollik loglari, Integratsiyalar, Texnik monitoring, API kalitlar

## Administrator Modules (23 pages)

Boshqaruv paneli, Hisobotlar, Statistika, O'quvchilar, O'qituvchilar, Psixologlar, Xodimlar, Kurslar, Guruhlar, To'lovlar, Daromadlar, Tranzaksiyalar, Testlar, Natijalar analitikasi, Chat, Bildirishnomalar, Uchrashuvlar, E'lonlar, Markaz sozlamalari, Xodim rollari, Xavfsizlik, Audit loglari, Integratsiyalar

## Mobile Screens (12 screens)

**Auth**: Kirish, Ro'yxatdan o'tish, OTP tasdiqlash, Parolni tiklash
**Tabs**: Asosiy, Psixologiya, Kontent, Hamjamiyat, Profil
**Internal**: Rivojlantirish, Xabarlar, Market

## Key Commands

- `pnpm --filter @ruhiyat/api run dev` — API (port 3000)
- `pnpm --filter @ruhiyat/superadmin-web run dev` — Superadmin (port 3100)
- `pnpm --filter @ruhiyat/admin-web run dev` — Admin (port 3200)
- `cd apps/api && npx prisma db push` — push schema
- `cd apps/api && npx prisma studio` — Prisma Studio

## Database

52 Prisma models at `apps/api/prisma/schema.prisma` covering Auth, Profiles, Education, Assessments, Communication, Community, Content, Meetings, Finance, System, Wellness.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — JWT signing secrets
- `SESSION_SECRET` — session secret

## Architecture

- Sidebar + header layout pattern for web panels
- Bottom tab navigation for mobile (5 tabs)
- shadcn/ui components (button, card, sidebar, sheet, avatar, dropdown-menu, etc.)
- ThemeProvider for dark/light mode toggle
- AuthContext for mobile auth state management
- API client layer (`src/services/api.ts`) in mobile
- Module placeholder pattern for consistent page structure
