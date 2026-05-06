# Task Spec: v2-owner-review-fixes-20260505

## Goal
Fix the five review findings from the V2 owner screens implementation with the smallest safe changes.

## Acceptance Criteria
- AC1: Creating a list no longer overwrites existing `profiles.display_name` or `profiles.handle`.
- AC2: `027_profiles_handle_unique.sql` repairs duplicate lowercased handles before creating the unique expression index.
- AC3: Notifications rows do not nest a button inside a link; row link and read action remain independently usable.
- AC4: `/lists/new` does not fall back to another owned list when the `list` query param is missing or invalid.
- AC5: Mobile owner settings panel overrides are not defeated by later generic modal CSS.
- AC6: Lint, typecheck, build, and unit tests pass or failures are documented.

## Verification Plan
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
