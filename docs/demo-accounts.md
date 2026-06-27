# Garemo Demo Accounts

This document intentionally does not store passwords or Supabase secrets.

## Existing Manual Accounts

- Admin: `marvinjhohan@gmail.com`
- Owner demo: use the existing owner account already created in Supabase Auth for internal testing.

Passwords must be shared out-of-band only for the live demo. Do not commit passwords, API keys, or Supabase service role values.

## Buyer Accounts

The SQL demo seed does not create Supabase Auth users because `users_profile.id` references `auth.users(id)`.

For a full buyer login demo, create buyer accounts through `/signup` with controlled email inboxes, confirm the emails, then use the app normally. This keeps Auth credentials, profile creation, and RLS behavior aligned with production.

## Demo Data Policy

- Business demo rows use slugs prefixed with `demo-`.
- Demo comments and moderation notes use the prefix `DEMO:`.
- Run `supabase/clean_demo_garemo.sql` to remove only demo rows.
- Never edit `auth.users` directly by SQL.
