# Task Spec: v2-owner-remaining-screens-20260505

## Metadata
- Task ID: v2-owner-remaining-screens-20260505
- Created: 2026-05-05
- Repo root: C:\Users\BELLWERK\Documents\PROJECTS\JQ33 LABS\desira
- App scope: desira-v2

## Goal
Implement the remaining V2 owner-side screens as a functional MVP, anchored on List Settings, with restrained app UI, explicit save flows, Zod validation, and authenticated owner/user checks for every mutation.

## Acceptance Criteria
- AC1: `/lists/[id]/settings` is a real owner-only settings screen with Basics, Sharing, Gift Controls, and Danger Zone sections.
- AC2: List settings support editing title, recipient/list type, event date, visibility (`public` or `unlisted` via Public/Link-only UI), reservation/contribution/anonymous toggles, and typed-title deletion.
- AC3: List settings mutations validate with Zod, preserve explicit false booleans, block non-owner access, and redirect or refresh predictably after success.
- AC4: `/settings/profile` allows editing display name and username while showing email read-only; username is slug validated, reserved-name blocked, and duplicate handles rejected.
- AC5: `/settings/password-privacy` contains useful privacy guidance without adding storage, password changes, or email changes.
- AC6: `/settings/account` shows read-only account identity/provider details and sign-out, without account deletion.
- AC7: `/notifications` renders a real inbox with loading/empty/error/read/unread states and mark-one/mark-all-read behavior backed by user-scoped API routes.
- AC8: `/feedback` renders a working bug report form backed by an authenticated, Zod-validated API route.
- AC9: `/lists/new` remains a first-wish setup flow and receives modest polish without changing the workflow.
- AC10: Evidence artifacts are created under `.agent/tasks/v2-owner-remaining-screens-20260505/`, and lint/typecheck/build/relevant tests are run or documented if infeasible.

## Non-Goals
- No collaborator/member invite UI.
- No DB migration unless a current schema guarantee is missing.
- No account deletion, email change, password change, or account-level privacy preference storage.
- No private-member visibility UI in V2; existing DB `private` may be displayed as Link-only if encountered.

## Verification Plan
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- Targeted API/static checks where feasible.
