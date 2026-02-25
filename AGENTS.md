## Codex review focus
- Auth & permission issues (Supabase RLS + server checks)
- Input validation on all mutations (Zod)
- Stripe Connect correctness (destination charges, transfers)
- Secrets/PII leakage (logs, client bundles)
- TypeScript safety (no any, no unsafe casts)
- Next.js App Router best practices (server/client boundaries)

---

## Frontend (Next.js + React + TypeScript)

### When to Apply

Apply when working on:
- Pages, layouts, or route segments
- React components (server or client)
- Forms, buttons, links, and interactive UI
- Styling (CSS, Tailwind, globals)
- Client vs server component decisions
- Accessibility or responsive behavior

### Next.js App Router Rules

- **Server by default**: Prefer Server Components. No `"use client"` unless the component needs state, effects, event handlers, or browser APIs.
- **Client only when needed**: Use Client Components for: `useState`, `useEffect`, `onClick`/`onChange`, `localStorage`, Stripe redirects, or DOM APIs.
- **No server secrets in client**: Never import server-only modules or expose env secrets in client bundles.
- **Route handlers for mutations**: Use `app/api/.../route.ts` or server actions for writes; validate with Zod on the server.
- **Async params**: In Server Components, `params` can be a Promise; await before use: `const { id } = await params;`.

### Component Conventions

- **Small files**: Keep components under ~200 lines; split into smaller components or helpers when larger.
- **Explicit columns**: When fetching data, prefer explicit `select(['id','name',...])` over `select('*')`.
- **Type safety**: Use typed props and avoid `any`. Use unions for statuses (e.g. `"active" | "reserved" | "funded"`).
- **Normalize booleans**: For DB booleans that may be null, normalize: `(value ?? true)` for allow_* toggles.

### React / State Gotchas

- **No setState in useEffect**: Avoid `setState(...)` directly inside `useEffect`. Prefer derived state, or `queueMicrotask(() => setState(...))` for async bootstraps (e.g. localStorage).
- **Client boundaries**: Pass serializable props to Client Components (no functions or class instances from server unless passed via server action).

### UI and Product Principles

- **Navigator-first**: Public list pages must let users decide and act (reserve, contribute, buy) without extra explanation.
- **Surprise-safe**: Public views never reveal reserver identity or payment details.
- **Taste over features**: Reduce friction and awkwardness; avoid unnecessary UI or copy.
- **Clear outcomes**: Two paths per item—Buy (external link) or Contribute (Stripe). Make both obvious.

### Styling and Layout

- Prefer project patterns (e.g. existing `GlassCard`, `GlassButton`, `BadgeChip`) over new one-off styles.
- Use semantic HTML and sufficient contrast; keep interactive targets large enough for touch.
- Responsive: ensure key actions work on small viewports.

### Forms and Validation

- **Server validates**: All mutations validate input with Zod on the server; client validation is optional UX.
- **Money on server only**: Never trust client-provided amounts; server computes fee and total (e.g. `fee_cents = max(100, round(contribution_cents * 0.05))`).
- **Idempotency**: For payments, use unique `provider_payment_intent_id` (or equivalent) to avoid duplicate charges.

### Checklist Before Shipping UI

- [ ] Correct server vs client boundary (no unnecessary `"use client"`).
- [ ] No secrets or PII in client bundle or logs.
- [ ] Forms/post actions validated with Zod on server.
- [ ] Public list: no reserver/payment identity exposed.
- [ ] Lint and build pass; existing routes still work.

---

## Cursor Cloud specific instructions

### Services

This is a single Next.js 16 app (no monorepo). All commands are in `package.json`:

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm build` | Production build (also validates types) |

### Environment variables

The app requires a `.env.local` file. Copy from `.env.example` and fill in values. Required secrets for full functionality:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase (hosted, no local DB)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe Connect
- `NEXT_PUBLIC_SITE_URL` — set to `http://localhost:3000` for local dev

The app starts and renders routes even without real Supabase/Stripe credentials — the login page shows a "Configuration Error" and public list routes show "List not found". This is sufficient for lint/typecheck/build and UI-only work.

### Gotchas

- **No local database**: This project uses hosted Supabase only (no `docker-compose.yml`, no `supabase/config.toml`). Migrations are in `supabase/migrations/` but are applied to a remote instance.
- **Node 22.x + pnpm 10.x**: Both are declared in `package.json` (`packageManager` field). The VM already has them pre-installed.
- **`onlyBuiltDependencies`**: `package.json` specifies `pnpm.onlyBuiltDependencies` for `esbuild`, `workerd`, and `supabase`, so `pnpm install` runs non-interactively.
- **Next.js 16 + React 19 + React Compiler**: The `reactCompiler: true` flag is set in `next.config.ts`. This uses `babel-plugin-react-compiler`.
- **Cloudflare deployment**: `pnpm build:cloudflare`, `pnpm preview`, `pnpm deploy` are for Cloudflare Workers. Not needed for local dev.
