# Resend Email Setup

Garemo already uses internal notifications as the source of truth for moderation events. Real email delivery should be added only after the email provider is configured and secrets exist outside the frontend.

## Provider

Recommended provider: Resend

Free plan reference for planning:

- 3,000 emails per month
- 100 emails per day

## Events To Email Later

- Business approved
- Business rejected or needs corrections
- Business suspended or under review
- Business reactivated
- Report resolved or dismissed

Email is secondary. The app must always write the internal `user_notifications` row first so the owner can see the message in `/account` and `/dashboard`.

## Secure Architecture

Use one server-side path only:

- Supabase Edge Function, or
- Next.js server-side API route

Do not call Resend from browser code. Do not expose `RESEND_API_KEY` in any `NEXT_PUBLIC_` variable.

Required secret:

```text
RESEND_API_KEY
```

Keep it in:

- Supabase Edge Function secrets, if using Edge Functions
- Vercel Environment Variables, if using a server-side API route

Never commit the key to Git.

## Domain Requirements

Before enabling real sends:

1. Create or confirm a Resend account.
2. Verify `garemo.online` in Resend.
3. Configure DNS records provided by Resend.
4. Use a sender from the verified domain, for example:
   - `no-reply@garemo.online`
   - `onboarding@garemo.online`
5. Confirm Supabase Auth SMTP uses a sender from `garemo.online`, not a generic sandbox sender.

## Edge Function Shape

If implemented with Supabase Edge Functions later, the function should:

1. Read `RESEND_API_KEY` from environment secrets.
2. Require an authenticated admin/server-side call.
3. Accept only a known moderation event type.
4. Load the notification/business/user data server-side.
5. Send a short human email.
6. Return generic errors to the client.

Do not let normal users pass arbitrary `to`, `subject`, or HTML content.

## Suggested Email Copy

Approved:

```text
Tu negocio fue aprobado
Tu emprendimiento ya esta visible en Garemo. Los compradores pueden encontrarte en el directorio y el mapa.
```

Rejected:

```text
Tu negocio necesita correcciones
El administrador reviso tu negocio y encontro observaciones. Corrige la informacion y vuelve a enviarlo a revision.
```

Suspended:

```text
Tu negocio esta en revision
Tu negocio fue suspendido temporalmente mientras revisamos reportes de la comunidad.
```

Reactivated:

```text
Tu negocio fue reactivado
Tu negocio vuelve a estar visible en Garemo.
```

## Current Status

Email sending is intentionally pending. Sprint 7K prepares the architecture and keeps internal notifications working first.
