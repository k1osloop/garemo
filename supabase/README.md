# Garemo Supabase Setup

This folder contains the Sprint 0 baseline SQL for the Garemo MVP.

## Files

- `schema.sql`: initial PostgreSQL schema, constraints, indexes, comments, and RLS enabled.
- `seed.sql`: initial category seed data.
- `policies.sql`: safe public read RLS policies for active categories and visible businesses.
- `rls-verification.sql`: read-only checks for RLS, public reads, private tables, and write grants.

## Create the Supabase Project

1. Go to Supabase and create a new project.
2. Suggested project name: `garemo-mvp`.
3. Choose the closest region to the pilot campus.
4. Enable email/password auth.
5. Create a Storage bucket later named `business-images`.

## Run `schema.sql`

1. Open the Supabase SQL Editor.
2. Copy the contents of `supabase/schema.sql`.
3. Run the SQL.
4. Confirm all tables were created in the `public` schema.
5. Confirm Row Level Security is enabled.

Important: Sprint 0 enables RLS but does not create open policies. Public reads and writes should be added only after role testing.

## Run `seed.sql`

1. Open the Supabase SQL Editor.
2. Copy the contents of `supabase/seed.sql`.
3. Run the SQL after `schema.sql`.
4. Confirm the categories table contains the initial categories.

## RLS Policies

Run `supabase/policies.sql` only after `schema.sql` and `seed.sql`.

This script allows controlled public `SELECT` access for:

- active categories
- active businesses in active categories
- locations attached to visible businesses
- schedules attached to visible businesses
- images attached to visible businesses
- contact info attached to visible businesses

It does not create public `INSERT`, `UPDATE`, or `DELETE` policies. It also does not open private tables such as `users_profile`, `favorites`, or `reports`.

After running `policies.sql`, run `supabase/rls-verification.sql` in the SQL Editor and confirm:

- RLS is enabled on application tables.
- Public read policies exist only for the intended directory tables.
- Private tables do not have public policies.
- Browser roles do not have write grants.
- Active categories are readable as the `anon` role.

## Environment Variables

Copy these values from Supabase Project Settings into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Keep `.env.local` local. Do not commit real secrets.

## Do Not Commit

- `.env.local`
- Service role keys
- Database passwords
- Supabase access tokens
- Production dumps
- Real user data
- Private business images

## Next Step

After running schema and seed manually, generate real database types and replace the temporary `types/database.ts` placeholder.
