# Garemo Supabase Setup

This folder contains the Sprint 0 baseline SQL for the Garemo MVP.

## Files

- `schema.sql`: initial PostgreSQL schema, constraints, indexes, comments, and RLS enabled.
- `seed.sql`: initial category seed data.

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
