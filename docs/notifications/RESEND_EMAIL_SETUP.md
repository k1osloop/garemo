# Resend Email Setup

Garemo uses internal notifications as the source of truth for moderation
events. Sprint 7M adds a server-side Resend integration that mirrors selected
events by email when `RESEND_API_KEY` is configured. If the key is missing, the
app records the event as `skipped` in `email_events` and keeps the in-app
notification flow working.

## Provider

Recommended provider: Resend

Free plan reference for planning:

- 3,000 emails per month
- 100 emails per day

## Events Covered

- Business approved
- Business rejected or needs corrections
- Nueva notificacion interna.
- Nuevo caso o mensaje de moderacion.
- Recuperacion de contrasena through Supabase Auth SMTP.
- Bienvenida after app profile creation when a confirmed session exists.
- Moderation case opened by admin
- Admin message sent to an entrepreneur
- Entrepreneur reply received by admin

Email is secondary. The app must always write the internal `user_notifications` row first so the owner can see the message in `/account` and `/dashboard`.

Moderation threads remain the primary operational inbox for verification
returns, report follow-up, suspension/reactivation, and
admin-to-entrepreneur messages. Email only mirrors a database event after the
database write succeeds.

## Secure Architecture

Use one server-side path only:

- `app/api/email/transactional/route.ts`

Do not call Resend from browser code. Do not expose `RESEND_API_KEY` in any `NEXT_PUBLIC_` variable.

Required secret:

```text
RESEND_API_KEY
GAREMO_EMAIL_FROM
```

Keep it in:

- Vercel Environment Variables, if using a server-side API route

Never commit the key to Git.

Optional public analytics variables live separately:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_CLARITY_PROJECT_ID
```

## Domain Requirements

Before enabling real sends:

1. Create or confirm a Resend account.
2. Verify `garemo.online` in Resend.
3. Configure DNS records provided by Resend.
4. Use a sender from the verified domain, for example:
   - `no-reply@garemo.online`
   - `onboarding@garemo.online`
5. Confirm Supabase Auth SMTP uses a sender from `garemo.online`, not a generic sandbox sender.
6. Confirm SPF, DKIM, and DMARC in Resend before enabling production sends.

## SPF / DKIM / DMARC Evidence Checklist

Production email is not considered ready until all DNS records are verified
from the provider dashboard and from public DNS lookups.

Required checks:

1. Resend domain status for `garemo.online` is `Verified`.
2. SPF TXT record includes the exact value Resend provides for the domain.
3. DKIM records match the hostnames and values shown by Resend.
4. DMARC TXT record exists at `_dmarc.garemo.online`.
5. Supabase Auth SMTP sender uses `no-reply@garemo.online` or another sender
   under the verified domain.
6. Password recovery sends a real email to an external mailbox.
7. A moderation notification sends a real email and writes an `email_events`
   row with `status = sent`.

Useful verification commands:

```powershell
nslookup -type=TXT garemo.online 1.1.1.1
nslookup -type=TXT _dmarc.garemo.online 1.1.1.1
```

If any record is pending, mark email readiness as external configuration
pending and keep in-app notifications as the source of truth.

## Server Route Shape

The Next.js route should:

1. Read `RESEND_API_KEY` from environment secrets.
2. Require an authenticated admin/server-side call.
3. Accept only a known moderation event type.
4. Load the notification/business/user data server-side.
5. Reject arbitrary recipient email from the browser.
6. Log `email_events` before send.
7. Send branded HTML through Resend.
8. Return generic errors to the client.

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

Moderation case:

```text
Tienes un mensaje de Garemo
El equipo de Garemo dejo una observacion sobre tu negocio. Entra a tu cuenta para responder o corregir la informacion solicitada.
```

## QA Checklist

1. Confirm `RESEND_API_KEY` exists in Vercel, not in the frontend.
2. Confirm `GAREMO_EMAIL_FROM` uses `garemo.online`.
3. Trigger a business approval and confirm `email_events.status = sent`.
4. Trigger a rejection/corrections flow and confirm owner receives email.
5. Trigger a moderation message and confirm the owner receives email.
6. Trigger password recovery and confirm Supabase Auth SMTP sends from the
   verified Garemo sender.
7. Confirm failures are logged as `failed` or `skipped`, without exposing
   secrets to the browser.

## Current Status

Sprint 7M code path is implemented. Real delivery remains blocked until
`RESEND_API_KEY` and verified sender settings are present in the deployment
environment.
