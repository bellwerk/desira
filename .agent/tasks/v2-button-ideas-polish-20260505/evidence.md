# Evidence: v2-button-ideas-polish-20260505

## Result
PASS

## Acceptance Criteria
- AC1 PASS: Removed the ideas grid `drop-shadow`; static check found no `drop-shadow` remnants in V2 app CSS.
- AC2 PASS: Added `public/arrow-icon.svg` and rendered it in each ideas `Buy it Online` icon container; browser smoke found 8 buy buttons and 8 SVG image instances.
- AC3 PASS: `.v2-submit-button` now uses a restrained 44px minimum height, 16px text, and 18px horizontal padding while retaining full-width layout.
- AC4 PASS: Main action pills were already restrained at 36px height and were left unchanged; nav/icon/destructive/compact item-card buttons were not globally resized.
- AC5 PASS: `.v2-most-desired` desktop sizing increased from 18px/106.5px/7.5px to 22px/128px/9px, with mobile override increased from 16px/7px to 19px/8px.
- AC6 PASS: lint, typecheck, build, unit tests, static checks, and browser smoke passed.

## Commands
- `npm run lint`: PASS, see `raw/lint.txt`.
- `npm run typecheck`: PASS, see `raw/typecheck.txt`.
- `npm run build`: PASS, see `raw/build.txt`.
- `npm run test:unit`: PASS, see `raw/test-unit.txt`.
- Static checks: PASS, see `raw/static-checks.txt`.
- Browser smoke: PASS, see `raw/browser-smoke.json`.

## Browser Notes
- `/ideas`: rendered 8 gift idea cards, 8 buy buttons, and 8 SVG arrow icons.
- `/lists/4414a5cf-0867-4580-98a1-0aef29f1a669`: rendered 16 Most Desired controls; Add Wish modal opened and rendered one `Next` button.
- `/lists/ffa1d324-935b-443a-b9ee-f719b5eb2473`: reachable, but this list did not contain item cards, so populated-list smoke used the earlier item-rich list route.
