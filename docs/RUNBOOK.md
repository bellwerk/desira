# Desira Operations Runbook

This runbook covers deploy, rollback, and first-response incident steps for the current Desira stack (Next.js + Supabase + Stripe + Cloudflare Workers/OpenNext).

## 1. Release Precheck

Run these from the repo root before deploy:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src e2e
pnpm playwright test e2e/smoke.guest.spec.ts e2e/smoke.owner.spec.ts --project chromium
```

Confirm required env/secrets are set in runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- Optional: `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`
- Optional: `ERROR_TRACKING_WEBHOOK_URL`

## 2. Deploy Procedure

1. Ensure branch is up to date and green.
2. Build and deploy:

```bash
pnpm deploy
```

3. Verify production quickly:
- Login flow works.
- `/app/lists` loads.
- Public list page (`/u/[token]`) renders.
- Stripe checkout entry route responds.
- New errors are not flooding logs.

## 3. Rollback Procedure

If a release causes regressions:

1. Identify last known good commit/version.
2. Roll back the Worker deployment in Cloudflare (dashboard or Wrangler deployment rollback/version promote flow).
3. If code rollback is needed in git, revert the bad commit(s) and redeploy:

```bash
git revert <bad_commit_sha>
pnpm deploy
```

4. Re-run smoke tests against production.

Notes:
- Prefer rollback of application code first.
- For Supabase migrations, do not hot-delete schema changes in production. Use a forward fix migration unless there is a tested down migration.

## 4. Incident Triage

Capture these first:

- Time incident started
- Impacted user flow(s)
- Error signatures (from logs and `/api/errors`)
- Last deploy SHA/time

Fast checks:

1. Auth failures: confirm Supabase env vars and auth service health.
2. Payments failing: confirm Stripe webhook secret and dashboard webhook events.
3. Link preview failures: check `[link-preview][metric]` logs and rate-limit/unavailable statuses.
4. Notification failures: check `[notifications]` logs and email provider credentials.

## 5. Recovery Verification

After mitigation or rollback, confirm:

1. No elevated 5xx rate on app/API routes.
2. Smoke flows pass (owner + guest).
3. Stripe webhook processing succeeds for a test payment.
4. Link previews and list actions behave normally.
5. Error tracking volume returns to baseline.

## 6. Post-Incident Follow-up

Within 24 hours:

1. Write incident summary (root cause, impact, detection gap, fix).
2. Add tests/guards to prevent recurrence.
3. Update this runbook when workflow changed during incident response.
