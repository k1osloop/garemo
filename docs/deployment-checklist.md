# Garemo Vercel Deployment Checklist

Use this checklist before creating a Vercel production deployment.

## Pre-Deploy

- [ ] `git status --short` is clean or contains only intentional changes.
- [ ] `.env.local` exists locally but is ignored by Git.
- [ ] `.env.example` contains only public required variable names.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Supabase `schema.sql`, `seed.sql`, and `policies.sql` were applied.
- [ ] Public RLS allows SELECT only for active public data.
- [ ] `users_profile` is not readable by anon users.
- [ ] DEV seed data is understood as test data, not production pilot data.

## Vercel Project Settings

Framework preset:

```text
Next.js
```

Build command:

```text
npm run build
```

Install command:

```text
npm install
```

Required Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Do not configure these in the frontend project:

```text
SUPABASE_SERVICE_ROLE_KEY
service_role
```

## Post-Deploy Smoke Test

- [ ] `/` loads the public landing.
- [ ] `/businesses` loads categories and visible businesses.
- [ ] `/businesses/[id]` loads a visible business profile.
- [ ] `/map` renders Leaflet/OpenStreetMap and visible pins.
- [ ] WhatsApp link opens from a business profile with public contact info.
- [ ] Vercel logs do not print environment variable values.
- [ ] Supabase anon check still returns blocked access for `users_profile`.

## Rollback Trigger

Rollback or pause promotion if any of these happen:

- Public pages fail because Supabase env variables are missing.
- Map route crashes because tiles or client-only Leaflet code fails.
- Private tables become readable with anon key.
- Vercel logs expose secret or private values.
- Public data includes unreviewed non-DEV sensitive information.
