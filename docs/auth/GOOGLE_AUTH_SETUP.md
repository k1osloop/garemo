# Google Auth setup for Garemo

Google Sign-In is implemented in the frontend as an optional Supabase Auth
provider. Email and password login remains active and must continue to work.

Status: implemented in frontend, pending external provider activation in
Google Cloud Console and Supabase Dashboard.

## Google Cloud Console

1. Create a new Google Cloud project or use an existing controlled project.
2. Configure the OAuth consent screen.
3. Create an OAuth Client ID with type `Web application`.
4. Add Authorized JavaScript origins:
   - `https://www.garemo.online`
   - `https://garemo.online`
   - `http://localhost:3000`
   - `http://127.0.0.1:3001`
5. Add Authorized redirect URIs using the callback shown by Supabase for the
   Google Provider. It normally has this format:
   - `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
6. Copy the Google Client ID and Client Secret.

Do not commit the Client Secret. Do not paste it into frontend code.

## Supabase

1. Open `Authentication > Providers > Google`.
2. Enable Google.
3. Paste the Google Client ID.
4. Paste the Google Client Secret.
5. Save.
6. Open `Authentication > URL Configuration`.
7. Set Site URL:
   - `https://www.garemo.online`
8. Add Redirect URLs:
   - `https://www.garemo.online/auth/callback`
   - `https://garemo.online/auth/callback`
   - `https://www.garemo.online/**`
   - `https://garemo.online/**`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3001/auth/callback`
   - `http://127.0.0.1:3001/**`

## Garemo app behavior

- `/login` and `/signup` show `Continuar con Google`.
- The app redirect target is `/auth/callback`.
- New Google users are completed with the existing safe profile RPC.
- Default role is `buyer`.
- If signup selected `Emprendedor`, the callback requests role `owner`.
- The frontend never offers or writes the `admin` role.
- Existing manual admins keep redirecting to `/admin`.

## Validation

1. Confirm email/password login still works.
2. Click `Continuar con Google` from `/login`.
3. Complete Google OAuth.
4. Confirm Garemo redirects according to role:
   - `buyer` to `/account`
   - `owner` to `/dashboard`
   - `admin` to `/admin` only when already assigned manually
5. Confirm `/signup` only offers `Comprador` and `Emprendedor`.
6. Confirm no user can create or elevate to `admin` from the frontend.

References:

- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase `signInWithOAuth`: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
