# Evidence: v2-remove-gift-controls-20260505

## Result
PASS

## Acceptance Criteria
- AC1 PASS: List Settings no longer renders Gift Controls or checkbox toggles.
- AC2 PASS: `UpdateListSettingsSchema` and `PATCH /api/v2/lists/[id]` no longer accept or update gift-control flags.
- AC3 PASS: Create List no longer renders the Gift Controls row or submits `giftControls`.
- AC4 PASS: Stripe checkout no longer selects or blocks on `allow_contributions`.
- AC5 PASS: Existing DB columns/defaults remain untouched in migrations for compatibility.
- AC6 PASS: lint, typecheck, build, and unit tests passed.

## Commands
- `npm run lint`: PASS, see `raw/lint-final.txt`.
- `npm run typecheck`: PASS, see `raw/typecheck-final.txt`.
- `npm run build`: PASS, see `raw/build-final.txt`.
- `npm run test:unit`: PASS, see `raw/test-unit-final.txt`.
- Static check: PASS, see `raw/static-checks-final.txt`.
- Browser DOM check: PASS, see `raw/browser-dom-check.json`.

## Browser Check
Reloaded the current settings page. DOM check found `hasGiftControlsText: false`, `checkboxCount: 0`, and 3 settings blocks: Basics, Sharing, Danger Zone.
