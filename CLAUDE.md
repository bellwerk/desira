# Desira — CLAUDE.md (Project Rules)

## Tech stack
- Next.js (App Router)
- TypeScript (strict)
- Supabase (Postgres + RLS)
- Stripe Connect (destination charges)
- pnpm
- Node 22.x

## How to work in this repo
- Make the smallest change that solves the task.
- Prefer simple, readable code over clever abstractions.
- Do NOT do wide refactors unless explicitly requested.
- Ask before adding any new dependency.

## Commands (always use pnpm)
- Install: pnpm install
- Dev: pnpm dev
- Build: pnpm build
- Lint: pnpm lint
- Typecheck: pnpm typecheck (if available) or ensure `pnpm build` passes
- Tests: pnpm test (if available)

Before you say a task is “done”, ensure:
- pnpm lint passes
- build/typecheck passes
- you didn’t break existing routes

## Next.js rules (App Router)
- App Router only (no Pages Router).
- Prefer Server Components by default.
- Use Client Components only when needed (state, effects, browser APIs).
- Keep server-side secrets on the server only (never expose in client code).
- Use route handlers (`app/api/.../route.ts`) or server actions consistently per feature.
- Keep files small (<200 lines). Split components/helpers when needed.

## TypeScript rules
- Strict mode stays ON.
- No `any` unless unavoidable (and comment why).
- Prefer `unknown` + validation over unsafe casts.
- Exported functions should have explicit return types.
- Avoid “magic strings”: use typed constants/unions for statuses.

## Supabase rules
- Never trust client input.
- All writes happen on the server (route handler or server action).
- Always enforce authorization with:
  - Supabase RLS (source of truth)
  - and server-side checks where needed (defense-in-depth)
- Prefer `select` with explicit columns (avoid `select *`).
- Handle and surface Supabase errors (don’t swallow errors).

## Stripe Connect rules (destination charges)
- Stripe calls happen server-side only.
- Never store or log secrets.
- Validate webhook signatures if implementing webhooks.
- Be explicit about who pays fees + how transfers are created.
- Avoid mixing test/live keys; use environment separation.

## Validation & security (non-negotiable)
- All server mutations must validate inputs (Zod preferred).
- Any auth-related route must check user session.
- Never log PII or secrets (tokens, emails, addresses, card-related data).
- If unsure, stop and ask.

## Structure suggestions (follow existing patterns first)
- Keep DB access in a dedicated server module (e.g. src/lib/db/*).
- Keep shared types in src/lib/types or src/types.
- Keep UI components in src/components (follow repo conventions).

## What I want from you (Claude)
When given a task:
1) Briefly state the plan (3–6 bullets).
2) Implement with minimal changes.
3) List exactly what files you changed and why.
4) Note any follow-ups / risks / edge cases.
