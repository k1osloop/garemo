# Garemo RC1 Release Checklist

## Build Quality

- [x] `npm run lint`
- [x] `npm run build`
- [x] Public smoke test: `/`, `/businesses`, `/map`
- [x] Protected smoke test: `/account`, `/admin` redirect unauthenticated users to login
- [ ] Production smoke test after deploy

## Email

- [x] Server-side email route exists.
- [x] Branded HTML email template exists.
- [x] Email events are logged in `email_events`.
- [x] Missing `RESEND_API_KEY` degrades to `skipped`.
- [ ] `RESEND_API_KEY` configured in Vercel.
- [ ] Resend SPF, DKIM, and DMARC verified.
- [ ] Supabase Auth SMTP sender confirmed as `garemo.online`.
- [ ] Real email send QA.

## Notifications

- [x] Notification history.
- [x] Read/unread state.
- [x] Archive state.
- [x] Date grouping.
- [x] Pending badge combines notifications and moderation messages.

## Admin And Moderation

- [x] Admin metrics include users, businesses, products, reports, moderation,
  notifications, email, audit, and 7-day growth.
- [x] CSV export for admin metrics.
- [x] Moderation messages can mirror email events.
- [x] Admin audit log table and RPC exist.
- [ ] Full production admin action QA after deploy.

## Security

- [x] No `service_role` in frontend.
- [x] `.env.local` ignored by Git.
- [x] `email_events` blocked for anon.
- [x] `admin_audit_logs` blocked for anon.
- [x] Non-admin insert into `admin_audit_logs` blocked by RLS.
- [x] Admin audit RPC works for admin.
- [ ] Rate limiting for email route.
- [ ] Dependency advisory: moderate PostCSS issue tracked upstream through Next.

## SEO And Analytics

- [x] Metadata, canonical, OpenGraph, and Twitter Cards.
- [x] `sitemap.xml`.
- [x] `robots.txt`.
- [x] JSON-LD WebApplication schema.
- [x] GA4 and Clarity script hooks.
- [ ] GA4 measurement ID configured in Vercel.
- [ ] Clarity project ID configured in Vercel.

## Performance

- [x] Build completes with Next.js optimizations.
- [x] Public routes smoke-tested without console errors.
- [ ] Lighthouse production score.
- [ ] Bundle analyzer review.

## Release Gate

RC1 can be deployed as code-ready only when build/lint/RLS pass. It becomes
production-ready after external email and analytics secrets are configured and
validated in production.
