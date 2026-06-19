# Garemo

Garemo is a mobile-first university commerce directory MVP. This repository is
currently at Sprint 0: base project setup only.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase client
- Leaflet / React Leaflet
- ESLint

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required later, when Supabase credentials exist:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Sprint 0 Scope

- Base Next.js project.
- Placeholder routes.
- Initial folder structure.
- Supabase client factory.
- Base UI placeholders.
- No real data connection.
- No Sprint 1 features.

## Commands

```powershell
npm run dev
npm run lint
npm run build
```

## Not Yet Implemented

- Payments
- Delivery
- Internal chat
- Native mobile app
- AI recommendations
- Advanced marketplace
- Full Supabase schema execution
