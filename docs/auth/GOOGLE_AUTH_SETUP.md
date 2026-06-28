# Google Auth Setup for Garemo

This document explains the external configuration needed to make the existing
Garemo Google Sign-In button work in production.

Do not commit Google Client Secret values, Supabase service role keys, or any
private API key.

## Current App Behavior

- Email/password login remains the primary supported login method.
- Google Sign-In is additive and uses Supabase OAuth.
- OAuth callback route: `/auth/callback`.
- New OAuth users are completed through the existing secure RPC:
  `public.create_initial_user_profile(requested_role, requested_full_name)`.
- Public signup roles remain limited to:
  - `buyer`
  - `owner`
- The frontend does not allow creating `admin`.

## Google Cloud Console

Create an OAuth Client ID:

- Application type: `Web application`
- Name: `Garemo Web`

Authorized JavaScript origins:

- `https://www.garemo.online`
- `https://garemo.online`
- `http://localhost:3000`

Authorized redirect URIs:

- Use the exact Supabase callback shown in Supabase Google Provider settings:
  `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

Copy the Client ID and Client Secret only into Supabase Provider settings.
Do not paste them into the codebase.

## Supabase

Go to:

`Authentication -> Providers -> Google`

Then:

1. Enable Google.
2. Paste the Google Client ID.
3. Paste the Google Client Secret.
4. Save.

Go to:

`Authentication -> URL Configuration`

Site URL:

- `https://www.garemo.online`

Redirect URLs:

- `https://www.garemo.online/auth/callback`
- `https://garemo.online/auth/callback`
- `http://localhost:3000/auth/callback`
- `https://www.garemo.online/**`
- `https://garemo.online/**`
- `http://localhost:3000/**`

## Validation Checklist

1. Open `https://www.garemo.online/login`.
2. Click `Continuar con Google`.
3. Select a Google account.
4. Confirm redirect back to Garemo.
5. Open `/account`.
6. Confirm role shown as `Comprador`.
7. Sign out.
8. Confirm email/password login still works.

## Security Notes

- Do not touch `auth.users` manually.
- Do not use `service_role` in the frontend.
- Do not allow admin creation from Google OAuth.
- `users_profile` stays protected by RLS.
- If an OAuth user has no profile, the app uses `auth.uid()` through the
  existing RPC to create only that user's own buyer/owner profile.
