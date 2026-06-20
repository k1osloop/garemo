# Garemo

Garemo is a mobile-first public directory MVP for university businesses. The
current public flow lets visitors explore visible businesses, open public
profiles, view map pins, and contact businesses through WhatsApp when a public
number exists.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client with anon key
- PostgreSQL / Supabase RLS
- Leaflet / React Leaflet with OpenStreetMap
- Vercel target deployment

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
```

Do not add `service_role` keys to the frontend or to Vercel public runtime
variables.

## Public Routes

- `/`: public landing page.
- `/businesses`: public business directory.
- `/businesses/[id]`: public business profile by id or slug.
- `/map`: public map for visible businesses with coordinates.

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

## Validation Commands

```powershell
npm run lint
npm run build
```

Expected public data checks with anon key:

- `categories`: 9 visible rows.
- `businesses`: visible active rows.
- `users_profile`: blocked for anon access.

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

## Out of Scope

- Login implementation.
- Entrepreneur dashboard.
- Public writes.
- Payments.
- Delivery.
- Chat.
- Reviews.
- AI recommendations.
- Native mobile app.
