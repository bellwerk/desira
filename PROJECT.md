# Desira — Project Tracker (MVP)

## What Desira is (1 paragraph)
Desira helps people choose gifts for someone (a person) or a group (family ↔ family). It supports two ways to “help”:
1) **Buy the gift** (via an external link) and **reserve it** so nobody duplicates it, while keeping reserver identity + gift details hidden.
2) **Contribute money** (“fundraiser”) to partially cover the cost so the receiver can buy it later.

---

## Product rules (non-negotiable)
- If an item is **reserved**, nobody else can reserve/buy the same item.
- Reservation hides: **who reserved** + **purchase details** (only show "Reserved").
- Contributors never see who else reserved unless explicitly allowed.
- Wish owners should see: total contributed, and (optionally) contributor list depending on privacy.
- Everything is permissioned: user sees only lists they belong to.
- **Mutual exclusivity (MVP):**
  - A wish **CANNOT be reserved** if it already has **any contributions (> 0)**.
  - A wish **CANNOT receive contributions** if it is **reserved**.
- **Self-gifting prevention:**
  - List recipients (owners) **CANNOT reserve or contribute** to their own list items.
  - "View list" button for owners should show read-only mode (no reserve/contribute buttons).

---

## Current status (update every session)
- Date: 2025-01-02
- Current branch: main
- What we're building now: M3 (Link Preview) ✅ DONE — next: M6 (Notifications) or M7 (Hardening)
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

#### Auth providers (configure in Supabase Dashboard → Authentication → Providers)
- [ ] **Google OAuth** — requires Google Cloud Console credentials
  - Create OAuth 2.0 Client ID at https://console.cloud.google.com/
  - Add redirect URI: `https://<project>.supabase.co/auth/v1/callback`
  - Add Client ID + Secret in Supabase
- [ ] **Facebook OAuth** — requires Meta Developer App
  - Create app at https://developers.facebook.com/
  - Add Facebook Login product
  - Add redirect URI: `https://<project>.supabase.co/auth/v1/callback`
  - Add App ID + Secret in Supabase
- [ ] **Apple OAuth** — requires Apple Developer account
  - Create Services ID at https://developer.apple.com/
  - Configure Sign in with Apple
  - Add redirect URI: `https://<project>.supabase.co/auth/v1/callback`
  - Add Service ID + Key in Supabase
- [ ] **Email / Magic Link** — built-in, just enable in Supabase
  - Enable "Email" provider in Supabase
  - Configure SMTP for production (optional for dev)

#### Login UI
- [x] Continue with Google button
- [x] Continue with Facebook button *(placeholder — needs Supabase config)*
- [x] Continue with Apple button *(placeholder — needs Supabase config)*
- [x] Email / password login + signup

### M2 — Data model v1 + RLS (critical)

#### Tables (v1)
- [x] `profiles` (id, handle, display_name, avatar_url, created_at, updated_at)
- [x] `lists` (id, owner_id, title, recipient_type, visibility, allow_reservations, allow_contributions, allow_anonymous, currency, share_token, occasion, event_date)
- [x] `list_members` (list_id, user_id, role: `owner|member`, status) — migration: `002_list_members.sql`
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
- [x] Only members can read a private list + its items — *migration 005*
- [x] Only members can create items on the list — *migration 005*
- [x] Reservations: public can see "Reserved" state, but NOT `reserved_by`
- [x] Contributions: public sees totals only via view; contributor identity hidden

#### Business rules (must be enforced server-side + DB)
- [x] Block **reserve** if contributions exist for that wish — *DB trigger (migration 005) + server check in /api/reservations*
- [x] Block **contribute** if that wish is reserved — *DB trigger (migration 005) + enforced in checkout route*
- [x] Block **reserve/contribute** if user is the list owner (self-gifting prevention)
  - [x] Server-side check in reserve + checkout routes
  - [x] Hide reserve/contribute buttons in UI for list owner — *ItemActions.tsx*

### M3 — UI v1 (no polish yet, just works)
- See docs/UI_SPEC.md for UI copy + components + share sheet.
- [x] App layout (sidebar/topbar)
- [x] Lists screen:
  - [x] Create list
  - [x] See my lists
- [x] List detail screen:
  - [x] Add wish
  - [x] Wish cards with: title, link, price, status
  - [x] Reserve button (shows "Reserved" after) — *ItemActions.tsx on /u/[token]*
  - [x] Contribute button (wish or list fund) — *ItemActions.tsx on /u/[token]*
- [x] List settings (edit list) — `/app/lists/[id]/settings`:
  - [x] Rename list title
  - [x] Change visibility (unlisted/private/public)
  - [x] Change recipient type (individual/group)
  - [x] Edit occasion, event date
  - [x] Toggle: allow reservations, allow contributions, allow anonymous
  - [x] Delete list (with confirmation)
- [x] Invite flow:
  - [x] Generate invite link — *InvitesSection.tsx*
  - [x] Accept invite — */app/invite/[token]*
## M3 — Link Preview: Auto-parse item metadata from URL

**Goal:** When a user pastes a product URL, Desira auto-fills item fields (best-effort) and never blocks manual entry.

### Scope (M3)
- [x] Extract **title**, **description**, **image**, **price (best-effort)** from a product link
- [x] Use **Open Graph / Twitter meta tags** + **JSON-LD** parsing
- [x] Server-side fetch (no client-side scraping)
- [x] Cache results to avoid repeated fetches

### Non-goals (M3)
- [ ] "Works on every store" reliability (JS-rendered pages / anti-bot)
- [ ] Headless browser scraping
- [ ] Guaranteed price accuracy

---

### UX / UI Behavior
- [x] URL input in "Add Item"
- [x] Debounce ~500ms after paste/typing
- [x] Show loading skeleton → then Preview Card (image + title + domain + price if found)
- [x] Autofill editable fields: title, description, image, price/currency (optional)
- [x] Failure state: inline error ("Couldn't fetch details…") + user can still save manually
- [x] "Refresh" button to refetch (`force=true`)

---

### API
**POST** `/api/link-preview`

**Request**
- `url: string`
- `force?: boolean` (bypass TTL)

**Response (success)**
- `ok: true`
- `normalizedUrl`
- `cached: boolean`
- `data: { title, description, image, images[], price?: { amount, currency } }`
- optional: `source` + `confidence` (nice-to-have)

**Response (failure)**
- `ok: false`
- `error: { code: INVALID_URL | FETCH_BLOCKED | TIMEOUT | NO_METADATA, message }`

---

### Parsing Priority
**Title:** `og:title` → `twitter:title` → JSON-LD `name` → `<title>`  
**Description:** `og:description` → `twitter:description` → JSON-LD `description` → `<meta name="description">`  
**Image:** `og:image` → `twitter:image` → JSON-LD `image` → `link[rel=image_src]`  
**Price (best-effort):** JSON-LD Product `offers.price` + `priceCurrency` → OG `product:price:*` → else null

---

### Caching
- [x] Cache by `normalizedUrl`
- [x] Default TTL: **7 days**
- [x] If price exists: TTL **24 hours**
- [x] `force=true` bypasses TTL

---

### Security / Abuse (must-have)
- [x] SSRF protection:
  - allow only `http/https`
  - block localhost + private/link-local IP ranges
  - DNS resolve + re-check
  - limit redirects (≤5)
  - timeout (6–8s)
  - max response size (1–2MB)
- [ ] Rate limit preview calls (e.g., per user/IP) — *deferred to M7 hardening*

---

### DB (if caching in Supabase)
**Table:** `link_previews`
- `normalized_url` (unique)
- `title`, `description`
- `image`, `images (jsonb)`
- `price_amount (numeric, nullable)`, `price_currency (text, nullable)`
- `status (ok|error)`, `http_status`, `error_code`
- `fetched_at`, `expires_at`
- optional: `raw_og (jsonb)`, `raw_jsonld (jsonb)`

---

### Implementation Tasks (in order)
1. [x] URL normalization (strip utm_*, fbclid, gclid, etc.) — `src/lib/url.ts`
2. [x] Route handler `/api/link-preview` with SSRF guard + caching read/write
3. [x] HTML fetch + meta parsing (OG/Twitter/meta/title)
4. [x] JSON-LD parsing (Product + Offers for price)
5. [x] UI wiring: debounce → fetch → preview card → autofill → editable fields
6. [x] Error handling + "Refresh" (`force=true`)
7. [ ] Rate limit + logging/metrics (status + error_code) — *deferred to M7*
8. [ ] Tests: normalization, SSRF, JSON-LD price extraction edge cases — *future*

### Acceptance Criteria
- [x] Pasting a typical ecommerce URL auto-fills title/desc/image in <3s (when available)
- [x] Price fills when present in JSON-LD/OG; otherwise stays empty (editable)
- [x] Failure never blocks saving an item manually
- [x] SSRF protections enforced (rate limiting deferred to M7)
- [x] Cache prevents repeated fetches for the same normalized URL within TTL


### M4 — Reserve flow (the "no duplicates" feature)
- [x] Reserve wish (atomic / safe, prevents duplicates)
- [x] Unreserve (only reserver, or owner/admin)
- [x] Block reserve if contributions exist (**enforced in DB + server**) — *migration 005 + /api/reservations*
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

### Affiliate link monetization (Skimlinks)
- [ ] Add redirect route `/go/[wishId]` (all outbound product clicks go through server redirect)
- [ ] Integrate Skimlinks to monetize outbound product links
- [ ] Add clear affiliate disclosure on `/l/[token]` (and anywhere product links appear)

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
- 2025-01-02:
  - Done: M3 Link Preview fully implemented:
    - `link_previews` table migration (006)
    - URL normalization + SSRF protection utilities (`src/lib/url.ts`)
    - `/api/link-preview` route with OG/Twitter/JSON-LD parsing + caching
    - `useLinkPreview` hook with 500ms debounce
    - `AddItemForm` wired up: paste URL → preview → autofill title/image/price
  - Deferred: Rate limiting (M7), comprehensive tests (future)
  - Next: M6 Notifications or M7 MVP hardening
  - Blockers: None
- 2024-12-31:
  - Done: Audited PROJECT.md — marked M2 RLS, M3 UI, and M4 reserve flow as complete. List settings page, invite flow, self-gifting prevention (UI+server), and mutual exclusivity (DB triggers + server checks) all implemented.
  - Next: M3 Link Preview (auto-parse item metadata from URL) OR M6 Notifications.
  - Blockers: None
- 2024-12-30 (evening):
  - Done: Added `list_members` table migration (002). Created list detail page `/app/lists/[id]` with add/delete items. Switched login to Google OAuth only (UI ready, needs Supabase config).
  - Next: Configure Google OAuth in Supabase. Add Facebook, Apple, Email login options. Invite flow.
  - Blockers: None
- 2024-12-30 (pm):
  - Done: Added "Add wish" functionality to list detail screen (modal form, Zod validation). Item cards with title, price, link, status badges (Available/Reserved/Funded). Delete item action with confirmation. Funding progress bar display.
  - Next: Invite flow (generate/accept links), or polish Reserve/Contribute buttons for owner testing.
  - Blockers: None
- 2024-12-30:
  - Done: M0 complete, M1 complete, M2 mostly complete (tables exist, views exist, RLS partial). Fixed reservation cancel flow (localStorage token format).
  - Next: M3 (app UI) — create/manage lists from authenticated dashboard.
  - Blockers: None
- 2024-12-29:
  - Done: Completed M0 + M1 (auth flow with sign in/out, protected /app, profiles table SQL).
  - Next: M2 (data model tables + RLS), then M3 (app UI).
  - Blockers: None
