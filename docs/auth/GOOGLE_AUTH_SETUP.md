# Google Auth Setup for Garemo

This document explains the external configuration needed to make the existing
Garemo Google Sign-In button work in production.

Do not commit Google Client Secret values, Supabase service role keys, or any
private API key.

## Current App Behavior

- Email/password login remains the primary supported login method.
- Google Sign-In is additive and uses Google Identity Services plus Supabase
  `signInWithIdToken`.
- Google POST callback route: `/auth/google/redirect`.
- Client completion route: `/auth/google/complete`.
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
- `https://garemo.vercel.app`
- `http://localhost:3000`

Authorized redirect URIs:

- `https://www.garemo.online/auth/google/redirect`
- `https://garemo.online/auth/google/redirect`
- `https://garemo.vercel.app/auth/google/redirect`
- `http://localhost:3000/auth/google/redirect`

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
- `https://www.garemo.online/auth/google/complete`
- `https://garemo.online/auth/callback`
- `https://garemo.online/auth/google/complete`
- `https://garemo.vercel.app/auth/callback`
- `https://garemo.vercel.app/auth/google/complete`
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/google/complete`
- `https://www.garemo.online/**`
- `https://garemo.online/**`
- `https://garemo.vercel.app/**`
- `http://localhost:3000/**`

## Production Validation Status

- `https://garemo.vercel.app` was validated with Google login on 2026-06-30.
- The tested account `marvinjhohan@gmail.com` completed Google login and was
  redirected to `/admin` as `Administrador`.
- `https://www.garemo.online` could not be validated on 2026-06-30 because DNS
  did not resolve from the test environment (`ERR_NAME_NOT_RESOLVED`).
- The domain must resolve before final Google Auth validation can be closed.

## Validation Checklist

1. Open `https://www.garemo.online/login`.
2. Click `Continuar con Google`.
3. Select a Google account.
4. Confirm redirect back to Garemo.
5. Open `/account`.
6. Confirm role shown as `Comprador`.
7. Sign out.
8. Confirm email/password login still works.
9. Open `/admin` with the admin test account and confirm the UI says
   `Administrador`.

## Security Notes

- Do not touch `auth.users` manually.
- Do not use `service_role` in the frontend.
- Do not allow admin creation from Google OAuth.
- `users_profile` stays protected by RLS.
- If an OAuth user has no profile, the app uses `auth.uid()` through the
  existing RPC to create only that user's own buyer/owner profile.
