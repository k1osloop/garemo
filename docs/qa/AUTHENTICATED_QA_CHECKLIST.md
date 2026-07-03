# Garemo Authenticated QA Checklist

Use this checklist before launch decisions. Do not store passwords, API keys,
session tokens, or screenshots containing secrets in the repository.

## Test Accounts

Minimum controlled accounts:

- 1 admin created manually through Supabase Auth and `users_profile`.
- 2 owners created through `/signup`.
- 2 buyers created through `/signup`.

Record only email addresses and Supabase user IDs when needed. Never record
passwords.

## Buyer Flow

- Sign up with email/password.
- Confirm email.
- Log in.
- Visit `/account`.
- Edit basic profile data if available.
- Search businesses.
- Open a business detail page.
- Save and remove a favorite.
- Submit or update a review for a business the user does not own.
- Report a business.
- Send or receive a message when available.
- Verify notifications show unread/read states.
- Log out.

## Owner Flow

- Sign up as owner.
- Confirm email.
- Log in.
- Visit `/dashboard`.
- Create first business.
- Confirm the business starts in review state.
- Confirm it does not become verified from the owner UI.
- Edit business profile.
- Edit location and service options.
- Upload business image and product image.
- Create, edit, pause, and delete or hide a product according to the safe UI.
- Receive an admin notification.
- Reply to moderation thread if available.
- Log out.

## Admin Flow

- Log in as the controlled admin.
- Visit `/admin`.
- Confirm non-admin users are blocked from `/admin`.
- Review pending businesses.
- Approve, reject, suspend, and reactivate only QA businesses.
- Confirm moderation messages and notifications are generated.
- Confirm metrics load.
- Export CSV if available.
- Confirm audit logs contain the action.
- Log out.

## Security Checks

- Anonymous user cannot write to profiles, businesses, products, favorites,
  reviews, reports, storage, messages, or notifications except through
  explicitly controlled public RPCs.
- Buyer cannot access owner-only mutation screens.
- Owner cannot edit another owner business.
- Owner cannot approve or verify their own business.
- Admin RPCs reject non-admin authenticated users.
- Storage paths reject uploads outside the owner business folder.
- `/api/email/transactional` returns `401` without an internal token.

## Evidence

Save evidence in the Obsidian project evidence folder, not in Git:

```text
01_Projects/Garemo/07_Evidencias/
```

Minimum evidence:

- Screenshots for each authenticated role.
- Sanitized Supabase query results.
- Lint/build output.
- E2E smoke output.
- Production route checks.
- Email delivery evidence without secrets.
