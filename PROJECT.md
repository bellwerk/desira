# Desira — Project Tracker (MVP)

## What Desira is (1 paragraph)
Desira helps people choose gifts for someone (a person) or a group (family ↔ family). It supports two ways to “help”:
1) **Buy the gift** (via an external link) and **reserve it** so nobody duplicates it, while keeping reserver identity + gift details hidden.
2) **Contribute money** (“fundraiser”) to partially cover the cost so the receiver can buy it later.

---

## Product rules (non-negotiable)
- If an item is **reserved**, nobody else can reserve/buy the same item.
- Reservation hides: **who reserved** + **purchase details** (only show “Reserved”).
- Contributors never see who else reserved unless explicitly allowed.
- Wish owners should see: total contributed, and (optionally) contributor list depending on privacy.
- Everything is permissioned: user sees only lists they belong to.
- **Mutual exclusivity (MVP):**
  - A wish **CANNOT be reserved** if it already has **any contributions (> 0)**.
  - A wish **CANNOT receive contributions** if it is **reserved**.

---

## Current status (update every session)
- Date: 2024-12-30
- Current branch: main
- What we're building now: M3 (App UI) — list management in /app
- What's blocked: None

---

## MVP scope (what must ship)

### Core loop
- Create a list (for a person OR a family/group)
- Invite members (private link or email invite)
- Add wishes (title, URL, price estimate, notes, priority)
- Reserve a wish (hidden)
- Contribute money to a wish or list (Stripe)
- Basic notifications (in-app, email later)

### MVP non-goals (explicitly NOT now)
- Full marketplace checkout inside Desira
- Complex recommendation engine
- Multi-currency + tax handling
- Mobile native apps

---

## Milestones & tasks (do in order)

### M0 — Repo + baseline (foundation)
- [x] Add `PROJECT.md`, `CLAUDE.md`, `AGENTS.md`
- [x] Confirm pnpm + Node 22 work locally
- [x] Add env template (`.env.example`)
- [x] Add lint + typecheck scripts (or confirm existing)
- [x] Add basic app shell routes:
  - [x] `/` marketing placeholder
  - [x] `/app` authenticated area

### M1 — Auth + app skeleton (Supabase)
- [x] Supabase project connected (local env vars working)
- [x] Auth: sign in/sign out
- [x] Protect `/app` (redirect if not authed)
- [x] User profile table (minimal) + RLS

### M2 — Data model v1 + RLS (critical)

#### Tables (v1)
- [x] `profiles` (id, handle, display_name, avatar_url, created_at, updated_at)
- [x] `lists` (id, owner_id, title, recipient_type, visibility, allow_reservations, allow_contributions, allow_anonymous, currency, share_token, occasion, event_date)
- [ ] `list_members` (list_id, user_id, role: `owner|member`, status) — **not yet implemented**
- [x] `items` (id, list_id, title, image_url, price_cents, target_amount_cents, note_public, note_private, product_url, merchant, status, sort_order) — *renamed from `wishes`*
- [x] `reservations` (id, item_id, status, reserved_by_name, reserved_by_email, cancel_token_hash, created_at, canceled_at)
- [x] `contributions` (id, item_id, amount_cents, fee_cents, total_cents, currency, contributor_name, message, is_anonymous, payment_status, provider, provider_payment_intent_id)
- [x] `payment_accounts` (owner_id, provider, provider_account_id, charges_enabled, payouts_enabled, details_submitted) — *Stripe Connect*

#### Views (for public access without exposing sensitive data)
- [x] `public_reservation_flags` (item_id, is_reserved) — hides reserver identity
- [x] `public_contribution_totals` (item_id, funded_amount_cents) — aggregates contributions

#### RLS rules (must-have)
- [x] Public can read unlisted lists via share_token (visibility != private)
- [x] Public views hide reserver identity and contributor details
- [ ] Only members can read a private list + its items
- [ ] Only members can create items on the list
- [x] Reservations: public can see "Reserved" state, but NOT `reserved_by`
- [x] Contributions: public sees totals only via view; contributor identity hidden

#### Business rules (must be enforced server-side + DB)
- [ ] Block **reserve** if contributions exist for that wish — *partial: not yet enforced*
- [x] Block **contribute** if that wish is reserved — *enforced in checkout route*

### M3 — UI v1 (no polish yet, just works)
- [ ] App layout (sidebar/topbar)
- [ ] Lists screen:
  - [ ] Create list
  - [ ] See my lists
- [ ] List detail screen:
  - [ ] Add wish
  - [ ] Wish cards with: title, link, price, status
  - [ ] Reserve button (shows “Reserved” after)
  - [ ] Contribute button (wish or list fund)
- [ ] Invite flow:
  - [ ] Generate invite link
  - [ ] Accept invite

### M4 — Reserve flow (the "no duplicates" feature)
- [x] Reserve wish (atomic / safe, prevents duplicates)
- [x] Unreserve (only reserver, or owner/admin)
- [ ] Block reserve if contributions exist (**enforced in DB + server**)
- [x] UI states:
  - [x] Available
  - [x] Reserved (no identity shown)
  - [x] Contributed (cannot reserve)
  - [ ] Unavailable/archived

### M5 — Money contributions (Stripe Connect destination charges)
- [x] Decide contribution target for MVP:
  - [x] Option A: contribute to a specific wish
  - [ ] Option B: contribute to list "fund"
  - (Pick ONE first, add the other later)
- [x] Stripe Connect onboarding (for receivers who want payouts)
- [x] Contribution checkout (server-only Stripe calls)
- [x] Webhook(s) for payment confirmation
- [x] Save contribution records to DB
- [x] Show totals in UI
- [x] Block contributions if reserved (**enforced in DB + server**)

> Note: Keep compliance simple for MVP: record transactions cleanly, avoid storing sensitive data, server-only Stripe logic.

### M6 — Notifications v1 (minimum)
- [ ] In-app notifications table + UI (basic)
- [ ] Notify on:
  - [ ] new wish added
  - [ ] wish reserved
  - [ ] contribution received
- [ ] Email notifications (P1, later)

### M7 — MVP hardening (before “real users”)
- [ ] Error states + toasts
- [ ] Loading states
- [ ] Basic audit log (optional but helpful)
- [ ] Seed/demo data for quick testing
- [ ] Security pass: confirm RLS + server checks
- [ ] Performance sanity: avoid N+1 queries

---

## P1 (after MVP)
- [ ] Gift idea suggestions (manual prompts, no heavy AI infra)
- [ ] Better privacy controls (per list: reveal contributors / anonymous)
- [ ] Public share link (read-only)
- [ ] Localization (EN/FR/RU)
- [ ] Image uploads for wishes
- [ ] Activity feed (timeline)

---

## Definition of done (for any task)
- [ ] Typecheck/build passes
- [ ] Lint passes
- [ ] No secrets/PII in logs
- [ ] RLS reviewed for touched tables
- [ ] Business rules enforced (reserve vs contribute mutual exclusivity)
- [ ] Feature tested on happy path + one failure path
- [ ] Small PR with clear description

---

## Running notes / decisions (keep short)
### Decisions we’ve made
- Use App Router only
- Use Supabase RLS as source of truth
- Stripe Connect: destination charges
- Reserve and contribute are mutually exclusive per wish (MVP)

### Open questions
- Should list owners see who reserved? (default: NO for MVP)
- Contributions: wish-level vs list-level vs both (start with one)

---

## Progress log (optional, 2–5 lines per session)
- 2024-12-30:
  - Done: M0 complete, M1 complete, M2 mostly complete (tables exist, views exist, RLS partial). Fixed reservation cancel flow (localStorage token format).
  - Next: M3 (app UI) — create/manage lists from authenticated dashboard.
  - Blockers: None
- 2024-12-29:
  - Done: Completed M0 + M1 (auth flow with sign in/out, protected /app, profiles table SQL).
  - Next: M2 (data model tables + RLS), then M3 (app UI).
  - Blockers: None
