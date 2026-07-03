# Garemo Analytics and Observability Setup

This document defines the minimum evidence required before marking Garemo
analytics and observability as production ready.

## Environment Variables

Set these only in the deployment environment. Do not commit real values.

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_CLARITY_PROJECT_ID=
```

Server-side email events use separate private variables:

```text
RESEND_API_KEY=
GAREMO_EMAIL_FROM=
```

## GA4 Evidence

GA4 is ready only when all checks pass:

1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` exists in Vercel Production.
2. Production HTML loads `https://www.googletagmanager.com/gtag/js`.
3. GA4 Realtime receives `page_view` from:
   - `/`
   - `/businesses`
   - `/map`
   - `/login`
   - `/signup`
4. Custom events are visible in DebugView or Realtime for:
   - `login`
   - `signup`
   - `business_created`
   - `favorite`
   - `report`
   - `verification`
   - `notification`
   - `chat_message`

## Microsoft Clarity Evidence

Clarity is ready only when all checks pass:

1. `NEXT_PUBLIC_CLARITY_PROJECT_ID` exists in Vercel Production.
2. Production HTML loads `https://www.clarity.ms/tag/`.
3. A production session appears in the Clarity dashboard.
4. Sensitive values such as passwords, tokens, and private messages are not
   visible in recordings.

## Application Logs

Minimum production evidence:

1. Vercel runtime logs are accessible for API routes.
2. `/api/email/transactional` returns `401` without an internal token.
3. Failed email events write sanitized errors to `email_events`.
4. Admin moderation actions write audit logs.
5. Supabase Auth logs can be reviewed from the Supabase dashboard.

## External Pending Rule

If GA4, Clarity, Resend, or Supabase SMTP cannot be verified from their
dashboards, the launch status must remain external configuration pending.
