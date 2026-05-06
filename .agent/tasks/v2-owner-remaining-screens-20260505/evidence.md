# Evidence Bundle: v2-owner-remaining-screens-20260505

## Summary
- Overall status: PASS
- Last updated: 2026-05-05
- App scope: `desira-v2`

## Acceptance Criteria Evidence
- AC1/AC2: `/lists/[id]/settings` now renders a real owner settings surface with Basics, Sharing, Gift Controls, and Danger Zone in `desira-v2/src/app/(app)/lists/[id]/settings/`.
- AC3: List PATCH/DELETE mutations are in `desira-v2/src/app/api/v2/lists/[id]/route.ts` with Zod validation, owner checks, explicit false boolean handling, and typed-title delete confirmation.
- AC4: `/settings/profile` now edits display name and username through `desira-v2/src/app/api/v2/profile/route.ts`; reserved handles and duplicates are blocked. Migration `027_profiles_handle_unique.sql` adds a DB uniqueness guard.
- AC5: `/settings/password-privacy` now provides privacy guidance and list-privacy routing without adding storage or password/email mutations.
- AC6: `/settings/account` now shows read-only account identity/provider details and sign-out.
- AC7: `/notifications` now renders a real inbox client backed by `desira-v2/src/app/api/notifications/route.ts`.
- AC8: `/feedback` now renders a working bug report form backed by `desira-v2/src/app/api/bug-reports/route.ts`.
- AC9: `/lists/new` keeps the first-wish setup flow and has updated setup copy.
- AC10: Raw command logs are under `.agent/tasks/v2-owner-remaining-screens-20260505/raw/`.

## Commands Run
- `npm run lint` - PASS (`raw/lint.txt`, final rerun `raw/lint-final.txt`)
- `npm run typecheck` - PASS (`raw/typecheck.txt`, final rerun `raw/typecheck-final.txt`)
- `npm run build` - PASS (`raw/build.txt`, final rerun `raw/build-final.txt`)
- `npm run test:unit` - PASS, 11/11 tests (`raw/test-unit.txt`)
- `npm run test:integration` - SKIPPED by repo script because `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` are not configured (`raw/test-integration.txt`)

## Smoke Checks
- Started V2 dev server on `http://localhost:3001` (`raw/dev-server.txt`).
- HTTP smoke: `/login` returned 200; protected owner pages returned unauthenticated redirects; `/api/notifications` returned 401 for unauthenticated access (`raw/http-smoke.txt`).

## Known Gaps
- Authenticated browser interaction was not completed because the Playwright in-app browser session closed during protected-route navigation.
- Integration tests did not run without Supabase test credentials.
