# Desira — Project Tracker + UI Spec (MVP)

## What Desira is (1 paragraph)
Desira helps people choose gifts for someone (a person) or a group (family ↔ family). It supports two ways to “help”:
1) **Buy the gift** (via an external link) and **reserve it** so nobody duplicates it, while keeping reserver identity + gift details hidden.
2) **Contribute money** (“fundraiser”) to partially cover the cost so the receiver can buy it later.

---

## Access model (important)
### MVP: no accounts required for guests (and can even be no accounts at all)
- Wishlists are **unlisted**: anyone with the **guest link** can **view / reserve / contribute / click affiliate links**.
- List owners manage the list via a separate **manage link** (treat like a password).
- We do NOT rely on “members” for MVP access control. Access is **token-based**.

**Links**
- Guest link: `/l/[guestToken]` (shareable)
- Manage link: `/m/[manageToken]` (private)

---

## Product rules (non-negotiable)
- If an item is **reserved**, nobody else can reserve/buy the same item.
- Reservation hides: **who reserved** + **purchase details** (only show “Reserved.”).
- Guests do not need accounts to do anything on the guest link.
- **Mutual exclusivity (MVP):**
  - A wish **CANNOT be reserved** if it already has **any contributions (> 0)**.
  - A wish **CANNOT receive contributions** if it is **reserved**.
- Everything must be enforced **server-side + DB-level** (UI checks are not enough).

---

## Current status (update every session)
- Date:
- Current branch:
- What we’re building now:
- What’s blocked:

---

## MVP scope (what must ship)

### Core loop
- Create a list (no account required) → get guest link + manage link
- Add wishes (title, URL, price estimate, notes, priority)
- Share guest link
- Reserve a wish (hidden identity)
- Contribute money (Stripe)
- Click affiliate links (simple outbound link)
- Basic notifications (in-app later; can start with none)

### MVP non-goals (explicitly NOT now)
- Full marketplace checkout inside Desira
- Complex recommendation engine
- Multi-currency + tax handling
- Mobile native apps
- “Login + membership management” (can be P1)

---

# Milestones & tasks (do in order)

## M0 — Repo + baseline (foundation)
- [ ] Add `PROJECT.md`, `CLAUDE.md`, `AGENTS.md`
- [ ] Confirm pnpm + Node 22 work locally
- [ ] Add env template (`.env.example`)
- [ ] Add lint + build scripts (or confirm existing)
- [ ] Add minimal routes:
  - [ ] `/` (micro landing)
  - [ ] `/new` (create list)
  - [ ] `/l/[token]` (guest list)
  - [ ] `/m/[token]` (manage list)

## M1 — Token-based list creation (no auth)
- [ ] `/new` creates a list and returns:
  - [ ] guestToken
  - [ ] manageToken
- [ ] `/m/[manageToken]` can edit list settings + wishes
- [ ] `/l/[guestToken]` can view list + reserve + contribute
- [ ] Add “treat manage link like password” warning

## M2 — Data model v1 + enforcement (critical)

### Tables (v1)
- [ ] `lists`
  - `id`
  - `title`
  - `type` (`person|group`)
  - `guest_token` (unique)
  - `manage_token` (unique)
  - `created_at`
  - optional: `settings` json (privacy toggles, currency default, etc.)
  - optional: `stripe_connected_account_id` (for payouts)

- [ ] `wishes`
  - `id`
  - `list_id`
  - `title`
  - `url`
  - `price_estimate`
  - `notes`
  - `priority`
  - `status` (`active|archived`)
  - `created_at`

- [ ] `reservations`
  - `id`
  - `wish_id` (UNIQUE for active reservation)
  - `reserved_at`
  - `status` (`active|released`)
  - `reservation_secret` (string)  ← allows unreserve without accounts (optional but recommended)

- [ ] `contributions`
  - `id`
  - `wish_id` (nullable if list-level fund later)
  - `list_id` (for list-level contributions if enabled later)
  - `amount`
  - `currency`
  - `stripe_checkout_session_id`
  - `stripe_payment_intent_id`
  - `created_at`
  - optional: `display_name` (if you want contributors to leave a name)

### DB constraints (must-have)
- [ ] 1 active reservation per wish (unique index where status=active, or enforce with trigger logic)
- [ ] Tokens unique (`guest_token`, `manage_token`)
- [ ] Contribution amount > 0

### Business rules (must be enforced server-side + DB)
- [ ] Block **reserve** if contributions exist for that wish
- [ ] Block **contribute** if that wish is reserved
- [ ] Block reserve if already reserved (race-safe / atomic)

### Supabase/RLS approach for token-based MVP
- [ ] Use server-only DB access for all reads/writes (route handlers / server actions)
- [ ] Keep RLS strict (deny anon) and use server credentials for DB operations
- [ ] Never expose service role key to the client

## M3 — UI v1 (ship the loop; premium + playful)
- [ ] Build pages per UI spec below:
  - [ ] `/` micro landing
  - [ ] `/new` create list
  - [ ] `/l/[token]` guest list view (core)
  - [ ] `/m/[token]` manage view (edit list + wishes + Stripe connect)

## M4 — Reserve flow (no duplicates)
- [ ] Reserve wish (atomic / safe)
- [ ] Unreserve:
  - [ ] MVP choice: use `reservation_secret` (stored in localStorage/cookie) to allow same-device unreserve
- [ ] Block reserve if contributions exist (**DB + server**)
- [ ] UI states:
  - [ ] Available
  - [ ] Reserved (no identity shown)
  - [ ] Funded/Contributions started (cannot reserve)
  - [ ] Archived

## M5 — Money contributions (Stripe Connect destination charges)
- [ ] Decide contribution target for MVP:
  - [ ] Option A: contribute to a specific wish (recommended to start)
  - [ ] Option B: contribute to list “fund” (later)
- [ ] Stripe Connect onboarding in `/m/[manageToken]`
- [ ] Contribution checkout from `/l/[guestToken]` (server-only Stripe calls)
- [ ] Webhook(s) for payment confirmation
- [ ] Save contribution records to DB
- [ ] Show totals in UI
- [ ] Block contributions if reserved (**DB + server**)

## M6 — Notifications v1 (minimum)
- [ ] (Optional MVP) In-app notifications later
- [ ] For now, rely on UI states + totals
- [ ] P1: email notifications

## M7 — MVP hardening (before real users)
- [ ] Error states + toasts
- [ ] Loading states + skeletons
- [ ] Security pass: token leakage, server-only keys, Stripe webhooks verified
- [ ] Performance sanity: avoid N+1 queries, cache list read by token

---

# UI SPEC (single source of truth)

## Brand voice (playful + premium)
**Premium**
- Short, calm, confident copy.
- Minimal punctuation and hype.

**Playful**
- Tiny “wink” microcopy in modals/toasts/empty states only.
- Avoid memes / long jokes.

**Rule**
- If it’s important (payments, privacy): be premium.
- If it’s delightful (success): allow playful.

---

## Page copy + exact text

### `/` — micro landing (no big landing)
**H1:** Gifts, without duplicates.  
**Sub:** Reserve quietly, or chip in together. One link. No awkward chats.  
**Primary CTA:** Create a list  
**Secondary CTA:** See how it works

**How it works (3 cards)**
1) Add wishes (links, notes, price)  
2) Share one link  
3) Reserve or contribute — details stay hidden

**Trust line:** No accounts for guests. Just the link.  
**Footer note (tiny):** Some links may be affiliate links.

---

### `/l/[guestToken]` — public list (your real landing)
Header:
- **Title:** {ListTitle}
- **Subtitle:** Pick one. Reserve quietly. Or chip in.
- **Buttons:** Share (secondary) · Copy link (ghost)

Helper under Share:
- Anyone with this link can view and help. No account needed.

---

## Wish card states + microcopy (exact)

### State: Available
**Badge:** Available  
**Buttons:** Reserve (primary) · Chip in (secondary)  
Helper text under actions (small):
- Reservation keeps your name hidden.

### State: Reserved
**Badge:** Reserved  
Body line (small):
- Someone already claimed this one.
Disabled buttons:
- Reserve disabled
- Chip in disabled
Tooltip (on disabled):
- This item is reserved, so contributions are closed.

### State: Funded / Contributions started
**Badge:** Funded  (alt: Contributions started)  
Body line (small):
- This one’s in chip-in mode.
Buttons:
- Reserve disabled
- Chip in enabled
Tooltip (reserve disabled):
- Contributions already started. This item can’t be reserved.

---

## Dialogs / toasts (exact)

### Reserve confirm dialog
**Title:** Reserve this gift?  
**Body:** You’ll stay anonymous. Others will only see “Reserved.”  
**Primary:** Reserve  
**Secondary:** Cancel

Success toast:
- Reserved. You’re the silent hero.

### Reserve blocked dialog (because contributions exist)
**Title:** This one can’t be reserved  
**Body:** Contributions have already started, so this item is in chip-in mode.  
**Primary:** Chip in instead  
**Secondary:** Close

### Contribute dialog
**Title:** Chip in  
**Body:** Your contribution helps cover the cost.  
Quick amounts:
- $10 / $25 / $50 / Custom
Primary:
- Continue to payment
Secondary:
- Cancel

Success toast:
- Thank you. Added to the pot.

### Contribute blocked dialog (because reserved)
**Title:** Contributions are closed  
**Body:** This gift is already reserved. Pick another wish to support.  
**Primary:** Browse wishes  
**Secondary:** Close

---

## Empty states (exact)

### Empty list (no wishes yet)
**Title:** No wishes yet  
**Body:** Add a few ideas — links welcome.  
**Button:** Add first wish

### No results (search/filter)
**Title:** Nothing matches  
**Body:** Try fewer filters. Or add a new wish.

---

# Component-by-component spec (shadcn)

## Global UI rules
- Lots of whitespace, clean typography, rounded corners.
- Small motion only (150–200ms).
- One accent color (everything else neutral).
- Microcopy mostly in modals/toasts/empty states.

## Shadcn components to use
- Button (primary/secondary/ghost)
- Card (wish cards, page sections)
- Badge (Available/Reserved/Funded)
- Dialog (reserve confirm, contribute)
- Sheet (share sheet, optional filters)
- Input, Textarea (wish create/edit)
- DropdownMenu (sort, more actions)
- Tabs (All / Available / Reserved / Funded)
- Tooltip (why disabled)
- Separator
- Skeleton (loading)
- Alert (manage link warning)
- Toasts (sonner)

---

## Page layouts

### `/new` — Create list
- Card
  - Input: list title
  - Tabs or RadioGroup: For a person / For a group
  - Button primary: Create list
- On success: Card with:
  - Guest link (copy)
  - Manage link (copy) + Alert warning

### `/m/[manageToken]` — Manage list
- Edit list title/type
- Add/edit/delete wishes
- Stripe Connect section:
  - Connect / Disconnect (later)
  - Show connection status
- Share section:
  - Guest link copy
  - Manage link copy + warning

### `/l/[guestToken]` — Guest list
- Header + share controls
- Tabs: All / Available / Reserved / Funded
- Wish list grid (Card)
- WishCard component with states/actions

---

# Share sheet copy (UI labels + ready-to-send messages)

## Share sheet UI labels
Title: Share this list  
Guest link label: Guest link  
Guest helper: Anyone with this link can view, reserve, and chip in. No account needed.  
Buttons: Copy link · Copy message  
Manage link label: Manage link (private)  
Manage warning (Alert): Treat this like a password. Anyone with it can edit the list.

## Copy message templates
Default (best all-around):
- {ListTitle} — gift ideas 🎁
- Pick one to reserve (stays anonymous) or chip in.
- {Link}

More premium / less emoji:
- {ListTitle} — wishlist
- Reserve a gift quietly or chip in.
- {Link}

Person list:
- Gift ideas for {PersonName} 🎁
- Reserve to avoid duplicates (anonymous), or chip in.
- {Link}

Group list:
- {ListTitle} — group gift list
- Reserve one (anonymous) or chip in together.
- {Link}

With “rules” line (optional):
- {ListTitle}
- Reserve = anonymous. Chip-in = contributions (no reserving).
- {Link}

Email version
Subject options:
- {ListTitle} — wishlist link
- Gift list: {ListTitle}

Body:
Hi! Here’s the wishlist: {Link}
You can reserve a gift (stays anonymous) or chip in to contribute. No account needed.

---

# Definition of done (for any task)
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] No secrets/PII in logs
- [ ] Token access is server-validated (never client-trusted)
- [ ] Reserve/contribute mutual exclusivity enforced (DB + server)
- [ ] Feature tested: happy path + one failure path
- [ ] Small PR with clear description

---

## Running notes / decisions (keep short)
### Decisions we’ve made
- Unlisted, token-based access (no accounts for guests)
- Guest link can view/reserve/contribute/click links
- Manage link is private and can edit list
- Stripe Connect: destination charges
- Reserve and contribute are mutually exclusive per wish (MVP)

### Open questions
- Do we want list-level “fund” in MVP, or only wish-level?
- Unreserve method: same-device secret vs explicit “manage reservation” link

---

## Progress log (optional, 2–5 lines per session)
- YYYY-MM-DD:
  - Done:
  - Next:
  - Blockers:
