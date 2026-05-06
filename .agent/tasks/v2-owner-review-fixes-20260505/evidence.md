# Evidence: v2-owner-review-fixes-20260505

## Result
PASS

## Acceptance Criteria
- AC1 PASS: `POST /api/v2/lists` now reads `profiles` first and only inserts a missing profile. Existing `display_name` and `handle` are not updated; insert race `23505` is treated as non-fatal.
- AC2 PASS: `027_profiles_handle_unique.sql` normalizes unsafe handles and repairs case-insensitive duplicates with an `-<id8>` suffix before creating `profiles_handle_unique_lower_idx`.
- AC3 PASS: notification row content is split into a row wrapper, sibling link/static content, and sibling `Read` button. Static check found no `a button` or `button a` pattern.
- AC4 PASS: `/lists/new` redirects missing `list` to `/lists`; invalid explicit ids no longer fall back to `ownedLists[0]` and reach `notFound()`.
- AC5 PASS: a later, more-specific mobile `.v2-modal-panel.v2-owner-settings-panel` rule restores constrained width, rounded corners, and bounded height after the generic mobile modal rule.
- AC6 PASS: lint, typecheck, build, and unit tests all passed.

## Commands
- `npm run lint`: PASS, see `raw/lint.txt`.
- `npm run typecheck`: PASS, see `raw/typecheck.txt`.
- `npm run build`: PASS, see `raw/build.txt`.
- `npm run test:unit`: PASS, see `raw/test-unit.txt`.
- Targeted static checks: PASS, see `raw/targeted-static-checks.txt`.
- Browser smoke: PASS for `/notifications` and `/feedback` reachability/basic DOM checks, see `raw/browser-smoke.json`.

## Notes
- A viewport-specific browser smoke using the separate Playwright backend could not run because that backend page was closed. AC5 was verified statically against CSS order/specificity and by build/lint/typecheck.
