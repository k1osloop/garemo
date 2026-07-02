# Garemo

Garemo is a mobile-first university marketplace for discovering verified
campus businesses, products, map locations, WhatsApp contact, account flows,
admin moderation, notifications, and trust signals.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client with anon key
- PostgreSQL / Supabase RLS
- Leaflet / React Leaflet with OpenStreetMap
- Vercel target deployment
- Resend-ready server-side transactional email
- Google Analytics 4 / Microsoft Clarity hooks

## Local Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Fill `.env.local` with the Supabase public project values before running the
public directory locally. Do not commit `.env.local`.

## Required Environment Variables

Set these variables locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_CLARITY_PROJECT_ID=
RESEND_API_KEY=
GAREMO_EMAIL_FROM=
```

Do not add `service_role` keys to the frontend, Vercel public runtime
variables, Git, logs, or reports.

## Public Routes

- `/`: public landing page.
- `/businesses`: public business directory.
- `/businesses/[id]`: public business profile by id or slug.
- `/map`: public map for visible businesses with coordinates.
- `/signup`: public buyer/owner signup.
- `/login`: email/password and Google login surface.
- `/account`: authenticated buyer/owner account, notifications, favorites,
  reviews, and moderation messages.
- `/dashboard`: authenticated owner dashboard.
- `/admin`: authenticated admin moderation and metrics dashboard.
- `/api/email/transactional`: authenticated server-side email mirror for
  trusted app events.

The public app reads from Supabase through RLS-safe SELECT queries. It does not
perform public INSERT, UPDATE, or DELETE operations.

## Supabase Baseline

Run these files manually in the Supabase SQL Editor for a fresh project:

```text
supabase/schema.sql
supabase/seed.sql
supabase/policies.sql
```

Optional DEV-only validation data:

```text
supabase/dev_seed_owner_profile.sql
supabase/dev_seed_businesses.sql
supabase/dev_seed_locations.sql
```

Review DEV seeds before running them outside local validation.

For Sprint 7M RC1, also apply:

```text
supabase/sprint_7m_rc1_release_candidate.sql
```

## Validation Commands

```powershell
npm run lint
npm run build
```

Expected public data checks with anon key:

- `categories`: visible rows.
- `businesses`: visible active rows.
- `users_profile`: blocked for anon access.
- `email_events` and `admin_audit_logs`: blocked for anon access.
- admin metrics RPC: accessible only to authenticated admin role.

## Vercel Deployment

Vercel supports Next.js with zero-configuration framework detection. Use the
default Next.js build settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: managed by Next.js/Vercel

In Vercel Project Settings > Environment Variables, add:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_CLARITY_PROJECT_ID
RESEND_API_KEY
GAREMO_EMAIL_FROM
```

Add them for Production and Preview if both environments should read the same
Supabase project. Redeploy after changing environment variables.

Post-deploy validation:

1. Open `/`.
2. Open `/businesses` and confirm public businesses load.
3. Open one `/businesses/[id]` profile.
4. Open `/map` and confirm map tiles and pins render.
5. Confirm no secret values are visible in Vercel logs.
6. Confirm Supabase anon still cannot read `users_profile`.
7. Confirm `/admin` loads only for admin.
8. Confirm transactional emails are `sent`, or `skipped` if `RESEND_API_KEY`
   is intentionally absent.
9. Confirm `robots.txt`, `sitemap.xml`, OpenGraph, canonical, and analytics
   script behavior.

## Out of Scope

- Payments.
- Delivery.
- Native in-app payment/order flow.
- AI recommendations.
- Native mobile app.
