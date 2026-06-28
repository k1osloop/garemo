# Google Auth setup for Garemo

Google Sign-In is implemented as an optional Supabase Auth provider. Email and
password login remains the fallback and must keep working.

## Required external setup

1. In Google Cloud Console, create an OAuth Client for a web application.
2. Add authorized redirect URIs:
   - `https://garemo.online/auth/callback`
   - `https://www.garemo.online/auth/callback`
   - `https://garemo.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3001/auth/callback`
3. Copy the Google Client ID and Client Secret.
4. In Supabase Dashboard, open `Authentication > Providers > Google`.
5. Enable Google and paste the Client ID and Client Secret.
6. In Supabase `Authentication > URL Configuration`, allow:
   - `https://garemo.online/**`
   - `https://www.garemo.online/**`
   - `https://garemo.vercel.app/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3001/**`

## App behavior

- Login and signup show `Continuar con Google`.
- The callback route is `/auth/callback`.
- New Google users receive a safe initial profile with role `buyer` by default.
- If signup selected `Emprendedor`, the callback asks the existing secure RPC to
  create an `owner` profile.
- The frontend never offers or writes the `admin` role.

## Validation

1. Confirm email/password still logs in.
2. Click `Continuar con Google` from `/login`.
3. Complete Google OAuth.
4. Confirm Garemo redirects according to role:
   - `buyer` to `/account`
   - `owner` to `/dashboard`
   - `admin` to `/admin` only when already assigned manually
5. Confirm users cannot choose `admin` from `/signup`.

Reference docs:

- Supabase Auth Google provider: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase `signInWithOAuth`: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
