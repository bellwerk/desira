# Accessibility Contrast Audit (Batch 4)

Date: 2026-03-10

## Scope audited
- Login flow (`/login`)
- Owner list flows (`/app/lists`, `/app/lists/[id]`)
- Owner modals (`Share list`, `Add Wish`, `Wish Details`, `List Settings`)
- Public list flow (`/u/[token]`)
- Public contribution/pay flows (`/u/[token]/contribute`, `/u/[token]/pay`)

## What was fixed
- Increased global secondary/muted text token contrast in light/dark palettes.
- Replaced low-opacity text/placeholder styles on dark surfaces.
- Strengthened footer/legal-link contrast for non-app routes.
- Darkened primary CTA token and updated hardcoded purple CTA usages.
- Improved contrast in item/action badges and helper states.
- Normalized loading-state and modal-state contrast behavior.

## Automated verification
- Added Playwright + axe-core contrast regression test:
  - `e2e/accessibility.contrast.spec.ts`
- Coverage includes light and dark color-scheme runs for the scope above.
- Last run result: `6 passed`.
