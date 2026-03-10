# Desira - Project Tracker

## Product Summary
Desira helps people organize gift wishlists for a person or a group. There are two core actions: someone can buy a gift through an external merchant link and mark it as bought so nobody duplicates the purchase, or they can contribute money toward a specific item so the receiver can buy it later.

---

## Product Rules
- Buy-lock and contribution are mutually exclusive per item.
- If an item is marked as bought, nobody else can buy-lock it or contribute to it.
- If an item has any successful contributions, nobody can buy-lock it.
- Buy-lock status hides buyer identity and purchase details from public and other contributors.
- List owners can see contribution totals.
- Contributor identity is hidden by default unless a later privacy setting explicitly allows reveal.
- Private lists are visible only to members.
- Unlisted lists are accessible by share link.
- Public lists are accessible without login and may be indexable.
- List owners cannot buy-lock or contribute to their own items.
- List owners may click outbound merchant links on their own lists.
- Public and owner views must never leak payment details or buyer identity.

---

## Current Status
- Date: 2026-03-02
- Current focus: M9 UI/UX polish correction pass
- Next focus after M9: M10 Publisher approval/public growth track
- Known blockers: None

---

## Scope

### MVP Must Ship
- Authenticated app shell
- Private, unlisted, and public lists
- Invite flow
- Item creation and editing
- Buy-lock flow (internal reservations)
- Item-level contributions with Stripe Connect destination charges
- In-app notifications
- Basic hardening, audit trail, and seed/demo data

### Explicit Non-Goals For MVP
- Native mobile apps
- Multi-currency and tax complexity
- Marketplace checkout inside Desira
- List-level contribution fund
- Advanced recommendation engine

---

## Architecture Decisions
- Next.js App Router only
- Supabase RLS is the source of truth for access
- Server validates all mutations
- Stripe Connect uses destination charges
- Public share route for MVP is `/u/[token]`
- `/l/[slugOrId]` is optional later as a marketing/SEO alias, not a required second implementation
- Item-level contributions are the only contribution target in MVP
- Outbound merchant routing uses `/api/go/[itemId]`

---

## Milestones

### M0 - Foundation
- [x] Add project instructions and environment templates
- [x] Confirm local Node/pnpm baseline
- [x] Confirm lint and typecheck scripts
- [x] Add base routes for `/` and `/app`

### M1 - Auth And App Skeleton
- [x] Supabase connected
- [x] Sign in and sign out
- [x] Protect `/app`
- [x] Minimal `profiles` table with RLS
- [x] Login UI for Google, Facebook, Apple, and email/password

#### Remaining External Auth Configuration
- [ ] Google OAuth provider configured in Supabase
- [ ] Facebook OAuth provider configured in Supabase
- [ ] Apple OAuth provider configured in Supabase
- [ ] Production email provider/SMTP configured if needed

### M2 - Data Model And RLS
- [x] `profiles`
- [x] `lists`
- [x] `list_members`
- [x] `items`
- [x] `reservations`
- [x] `contributions`
- [x] `payment_accounts`
- [x] `public_reservation_flags`
- [x] `public_contribution_totals`
- [x] RLS for private/member/public access patterns
- [x] Server and DB enforcement for buy-lock/contribute exclusivity
- [x] Server and UI enforcement for self-gifting prevention

### M3 - Core UI And Link Preview
- [x] App layout
- [x] Lists screen
- [x] List detail screen
- [x] List settings
- [x] Invite flow
- [x] Link preview API and UI
- [x] URL normalization and SSRF protections
- [x] Caching for previews
- [x] Manual entry remains possible on preview failure

#### Remaining M3 Follow-Ups
- [x] Link preview rate limiting
- [x] Link preview logging and metrics
- [x] Link preview tests for normalization, SSRF, and JSON-LD edge cases

### M4 - Buy-Lock Flow
- [x] Atomic buy-lock flow
- [x] Undo buy-lock flow
- [x] Buy-lock blocked when contributions exist
- [x] UI states for available, bought, and contributed
- [x] Archived/unavailable state

### M5 - Contributions And Affiliate Routing
- [x] Stripe Connect onboarding
- [x] Item-level contribution checkout
- [x] Payment webhook handling
- [x] Contribution records persisted
- [x] Contribution totals shown in UI
- [x] Contributions blocked when bought
- [x] `/api/go/[itemId]` outbound redirect
- [x] Skimlinks utility integration
- [x] Public affiliate disclosure snippet on product-link pages

### M6 - Notifications
- [x] In-app notifications table and UI
- [x] Notifications for item added
- [x] Notifications for item bought
- [x] Notifications for contribution received
- [x] Email notifications

### M7 - Hardening
- [x] Error toasts and loading states
- [x] Basic audit log
- [x] Seed/demo data support
- [x] Security review documentation
- [x] Performance sanity pass on obvious query waterfalls

#### Remaining Hardening Work
- [x] Rate limit `/api/link-preview`
- [x] Add centralized error tracking
- [x] Add production alerting
- [x] Add rollback/runbook documentation
- [x] Add user bug-report flow

### M8 - Adaptive Design
- [x] Hide sidebar on mobile
- [x] Add mobile navigation
- [x] Make header responsive
- [x] Ensure 44x44 touch targets
- [x] Add responsive page spacing
- [x] Prevent overlap with fixed mobile UI
- [x] Make item actions stack well on mobile
- [x] Fix dashboard card fixed-width behavior
- [x] Optimize add/edit forms for mobile
- [x] Test at 320, 375, 768, 1024, and 1280+ widths

### M9 - UI/UX Polish

#### Completed
- [x] Public page glass styling
- [x] Desira branding on public pages
- [x] `GlassCard` usage on public item cards
- [x] `ProgressBar` usage for contribution progress
- [x] Public footer branding
- [x] Hide owner-only payout controls from visitors
- [x] Sidebar active state contrast fixes
- [x] Sidebar tooltip labels
- [x] Sidebar hover feedback
- [x] Move/remove feature-suggestion entry
- [x] Unify primary color token usage in `GlassButton`
- [x] Add `danger` variant to `GlassButton`
- [x] Add `shared` variant to `BadgeChip`
- [x] Duplication audit completed
- [x] Shared `formatCurrency`
- [x] Shared `ErrorStateCard`

#### Remaining
- [x] Remove remaining inline color overrides
- [x] Show returning-user list summary on `/app`
- [x] Remove static placeholder sections from dashboard
- [x] Add upcoming-events countdown
- [x] Clarify app header primary toggle labels
- [x] Increase tiny profile text for readability
- [x] Add unread notification indicator
- [x] Improve `/app/lists` visual hierarchy
- [x] Add search/filter when a user has many lists
- [x] Differentiate "Shared with me" badge styling
- [x] Add list type thumbnail/icon treatment
- [x] Collapse share link after first-use emphasis
- [x] Add drag handles for `sort_order`
- [x] Improve back navigation affordance
- [x] Polish `/app/lists/new`
- [x] Polish login page
- [x] Polish `/app/settings`
- [x] Create shared `PageHeader`
- [x] Create shared `EmptyState`
- [x] Create shared `IconButton`
- [x] Extract shared modal shell
- [x] Consolidate duplicated owner/public item-card presentation
- [x] Replace remaining one-off button styles with `GlassButton` variants
- [x] Extract shared dark-form input styles
- [x] Replace equivalent inline progress markup with `ProgressBar`
- [x] Standardize "Most Desired" badge treatment
- [x] Add lightweight micro-interactions where they improve confirmation

#### Current Correction Pass
- [x] Move app navigation to a bottom bar on mobile while preserving desktop sidebar
- [x] Route returning users to `/app/lists` by default when they already have lists, while keeping `/app` available as the dashboard
- [x] Unify the add-item flow behind one product-first flow
- [x] If the user has no lists, branch cleanly into create-list first
- [x] Make item title and image clickable in owner and public views
- [x] Route all product clicks through `/api/go/[itemId]` in owner and public views
- [x] Improve Amazon URL handling and preview reliability
- [x] Decide Amazon affiliate strategy:
  - [ ] Option A: Skimlinks for Amazon too
  - [x] Option B: direct Amazon Associates for Amazon, Skimlinks for non-Amazon
- [x] Validate correction pass with manual sanity checks
- [ ] Apply Supabase migration `017_add_personal_recipient_type.sql` in the target environment

#### Task File - Minimal Card + Smart Buy (Guest) + Owner Buy Item / Item Received
This task refines the existing buy-lock flow into explicit item lifecycle states: `available | reserved | purchased | received`.

##### 0) Definition Of Done
- Card stays minimal with 2 buttons:
  - Guest: Buy gift + Contribute
  - Owner: Buy item + Item received
- Guest "Buy gift" uses Option B:
  - Tap Buy gift -> Reserve 24h -> open Buy sheet with 3 options
- If an item is reserved, it is not available to buy or contribute for anyone (locked).
- Clicking Buy on store does not auto-mark purchased; it stays reserved (24h).
- After outbound click, returning users see a banner prompting Mark purchased.
- Owner never reserves their own items. Owner can mark Item received globally.

##### 1) Status Model + Rules
###### 1.1 Status Enum
`available | reserved | purchased | received`

###### 1.2 Global Rules (All Viewers)
- `available`: buy + contribute enabled (guest) / buy + received enabled (owner)
- `reserved`: buy + contribute disabled for everyone
- `purchased`: disabled for everyone
- `received`: disabled for everyone (final)

###### 1.3 Ownership Rules
- Reservation owner = matching device token hash
- List owner = authenticated owner (or current list-ownership identity mechanism)

##### 2) DB Changes
###### 2.1 `gift_items` (Or Equivalent)
Add or confirm columns:
- `status` enum
- `reserved_until` timestamptz NULL
- `reserved_at` timestamptz NULL
- `reserved_by_token_hash` text NULL
- `affiliate_click_at` timestamptz NULL (set when guest clicks Buy on store)
- `purchased_at` timestamptz NULL
- `received_at` timestamptz NULL
- `received_by_owner_id` uuid NULL (optional but recommended for audit)

Indexes:
- index `(status, reserved_until)`
- index `(reserved_by_token_hash)` if helpful

Security:
- Guests: READ only via RLS; no direct writes
- Writes happen via server/edge endpoints with validation

##### 3) Anonymous Device Token (No Signup)
- [x] On first visit, generate `deviceToken = crypto.randomUUID()`
- [x] Persist in `localStorage` (optional cookie fallback)
- [x] Never store raw token; server stores and compares `hash(deviceToken)`

##### 4) API / Server Endpoints (Core)
###### 4.1 Reserve (24h) - called when guest taps Buy gift or Reserve only
`POST /api/gifts/:id/reserve`
- Input: `deviceToken`
- Behavior:
  - If `available` or (`reserved` and `reserved_until < now()`): set reserved
  - Set:
    - `status = reserved`
    - `reserved_at = now()`
    - `reserved_until = now() + 24h`
    - `reserved_by_token_hash = hash(deviceToken)`
    - clear `affiliate_click_at` (optional: only clear if this is a new reservation)
- If reserved by someone else and not expired: `409` with `reserved_until`

###### 4.2 Record Outbound Affiliate Click (Guest)
`POST /api/gifts/:id/affiliate-click`
- Input: `deviceToken`
- Validate:
  - item is `reserved`
  - `reserved_by_token_hash == hash(deviceToken)`
- Set `affiliate_click_at = now()`
- Return `affiliate_url` (the final URL to open)

###### 4.3 Cancel Reservation (Guest)
`POST /api/gifts/:id/cancel-reservation`
- Input: `deviceToken`
- Validate token owns reservation
- Set:
  - `status = available`
  - clear `reserved_*` + `affiliate_click_at`

###### 4.4 Mark Purchased (Guest)
`POST /api/gifts/:id/mark-purchased`
- Input: `deviceToken`
- Validate token owns reservation (recommended behavior for MVP)
- Set:
  - `status = purchased`
  - `purchased_at = now()`
  - clear `reserved_*` (optional keep audit)

###### 4.5 Mark Received (Owner)
`POST /api/gifts/:id/mark-received`
- Auth: list owner only
- Set:
  - `status = received`
  - `received_at = now()`
  - `received_by_owner_id = ownerId`
  - clear `reserved_*` + `affiliate_click_at` (owner wins)
- Log audit event if overriding `reserved` or `purchased`

###### 4.6 Contribute Payment (Guest)
- Must be blocked unless `status == available`
`POST /api/gifts/:id/contribute/create-session`
`POST /api/gifts/:id/contribute/webhook`
- On success: record contribution (money goes to owner)
- Reject if `reserved`, `purchased`, or `received`

##### 5) Reservation Expiry (24h)
Implement at least one:

###### Option A (Recommended MVP): Lazy Expiry
- On list/items fetch and on reserve attempt:
  - if `status = reserved` and `reserved_until < now()` -> release to `available` and clear reservation fields

###### Option B: Scheduled Cleanup
- Cron every 5-15 minutes:
  - release all expired reservations

##### 6) UI - Card + Sheets + Banner
###### 6.1 Guest Card (2 Buttons)
- Buttons: Buy gift (primary), Contribute (secondary)
- Under Buy gift add one-line helper text (small):
  - "We'll hold it for 24h."
- State rendering:
  - `available`: enabled
  - `reserved` / `purchased` / `received`: disabled + badge (Reserved / Purchased / Received)
  - On tap of a disabled reserved item: show info sheet "Reserved until {time}"

###### 6.2 Guest Buy Gift Flow (Option B)
On tap Buy gift:
- Call `/reserve`
- If success: open Buy sheet with 3 options

Buy sheet (guest):
1) Buy on {Store} (primary)
   - Note (small): "We'll hold it for 24h. After checkout, come back to mark purchased."
2) Reserve only (24h) (secondary)
   - Note: "Hold it while you decide."
3) I bought it elsewhere (tertiary)
   - Note: "Mark as purchased."

Actions:
- Buy on store:
  - call `/affiliate-click` -> open returned `affiliate_url`
  - keep status = `reserved` (do not auto-mark purchased)
- Reserve only:
  - close sheet (reservation already active)
- I bought it elsewhere:
  - call `/mark-purchased`

###### 6.3 Return Banner (Guest, No Signup)
Show banner when:
- There exists at least one item where:
  - `status == reserved`
  - reservation is owned by this device token
  - `affiliate_click_at IS NOT NULL`

Banner text:
- "Did you buy this gift?"
Buttons:
- Mark purchased (primary) -> `/mark-purchased`
- Not yet (secondary) -> dismiss for now (but banner can reappear on next visit/session)

Handling multiple reserved items:
- MVP: show most recent by `affiliate_click_at DESC`
- Optional: allow cycling Next or open list of reserved items

###### 6.4 Owner Card (2 Buttons, Different)
- Buttons: Buy item (primary), Item received (secondary)
- No Contribute for owner.

Owner Buy item behavior:
- Open Owner Buy sheet:
  - Primary: Buy on {Store}
  - Note: "After you buy it, tap Item received."
- Open affiliate link directly (track analytics), no reservation is created.

Owner Item received behavior:
- Call `/mark-received`
- Show toast: "Marked as received" + Undo (10-15s)
  - Undo strategy:
    - Store previous status client-side and call a safe revert endpoint, or
    - Implement soft-revert within the undo window (recommended if simple)

##### 7) Analytics Events
Track (minimum):
- `guest_buy_tap` (Buy gift tapped)
- `guest_reserved_success`
- `guest_reserved_conflict`
- `guest_buy_on_store_click` (before outbound)
- `guest_banner_shown`
- `guest_mark_purchased`
- `guest_cancel_reservation`
- `reservation_expired`
- `owner_buy_item_click` (outbound)
- `owner_mark_received`
- `owner_undo_received`
- `guest_contribute_tap`
- `guest_contribute_success`

##### 8) Abuse / Guardrails (Light)
- Limit active reservations per device token (for example, max 2-3)
- Rate limit reserve endpoint (IP + token)
- Reject contribute if not `available`

##### 9) Tests (Must-Have)
###### 9.1 Guest Reservation Locking
- Two browser contexts:
  - A reserves -> B sees Reserved and cannot buy/contribute
- A clicks Buy on store -> `affiliate_click_at` set
- A returns -> banner appears -> A marks purchased -> status becomes purchased, banner disappears
- Expiry: set `reserved_until` in past -> item becomes available

###### 9.2 Owner Behavior
- Owner sees Buy item + Item received (no Contribute)
- Owner Buy item does not reserve
- Owner marks received -> guest sees Received
- Owner marking received overrides reserved (audit logged)

###### 9.3 Contribute Rules
- Contribute allowed only when `available`
- Contribute blocked when `reserved`, `purchased`, or `received`

##### 10) Copy (Final)
- Guest helper under Buy gift: "We'll hold it for 24h."
- Buy sheet (guest) note under Buy on store:
  - "We'll hold it for 24h. After checkout, come back to mark purchased."
- Banner: "Did you buy this gift?" -> Mark purchased / Not yet
- Owner secondary button: Item received

### M10 - Publisher Approval And Public Growth
This milestone replaces the duplicate Skimlinks track. It is the single roadmap for crawlable public commerce pages, compliance, and reviewer readiness.

#### M10.1 Public Surfaces
- [x] Confirm `/u/[token]` is server-rendered with merchant links present in HTML source
- [x] Add metadata and OG tags to public list pages
- [x] Add public profile page at `/@/[username]`
- [x] Add `/explore` with featured and recent public lists
- [x] Add discoverable footer/navigation paths to public surfaces
- [ ] Optionally add `/l/[slugOrId]` only if aliasing materially helps SEO or reviewer clarity

#### M10.2 Compliance And Trust
- [x] Add `/affiliate-disclosure`
- [x] Add `/privacy`
- [x] Add `/terms`
- [x] Add `/about`
- [x] Add `/contact`
- [x] Add cookie consent if required by the final affiliate script implementation
- [x] Ensure disclosure and legal links are visible from public pages/footer

#### M10.3 Demo Content And Approval Readiness
- [ ] Seed 5-10 Desira-owned public demo lists
- [ ] Ensure each demo list has enough real merchant links to demonstrate commercial intent
- [ ] Remove all placeholder content from reviewer-visible pages
- [ ] Prepare 6-8 submission URLs for reapplication

#### M10.4 SEO And QA
- [x] Add sitemap for public lists and public profiles
- [x] Confirm `robots.txt`
- [x] Add canonical tags on public pages
- [x] Add structured data if useful
- [x] Add Playwright coverage for public reviewer flows

#### M10.5 Optional Expansion
- [ ] Add guides/collections only after profiles and explore are live
- [ ] Add publisher analytics page only after core approval requirements are met

### M11 - PWA Foundation
- [ ] Add `manifest.json`
- [ ] Add installable icons and metadata
- [ ] Add service worker
- [ ] Add install prompt
- [ ] Test installability on iOS Safari and Android Chrome

### M12 - Post-MVP / P1
- [ ] Better privacy controls for contribution reveal
- [ ] Localization
- [ ] Image uploads
- [ ] Activity feed
- [ ] Gift suggestions
- [ ] Push notifications
- [ ] Capacitor/app-store packaging only after the PWA is solid

---

## Ordered Execution Plan
1. Finish M9 current correction pass.
2. Close remaining M7 hardening gaps that affect safety or reliability.
3. Finish M8 adaptive design.
4. Execute M10.1 and M10.2 before any optional publisher polish.
5. Execute M10.3 and M10.4 to make the site reviewer-ready.
6. Do M11 only after the public web product is stable.
7. Treat M12 as true post-MVP work.

---

## Definition Of Done
- [x] Typecheck passes
- [ ] Build passes
- [x] Lint passes
- [ ] No secrets or PII in logs
- [ ] RLS reviewed for touched tables/routes
- [ ] Zod or equivalent server validation for touched mutations
- [ ] Buy-lock/contribute exclusivity still enforced
- [ ] Happy path tested
- [ ] At least one failure path tested
- [ ] No placeholder content on any user-facing page touched by the work

---

## Open Questions Requiring A Decision
- [ ] Whether to add `/l/[slugOrId]` as an alias after `/u/[token]` public pages are validated
- [ ] Whether contributor identity reveal belongs in MVP+1 or later
- [ ] Whether to run a full internal rename from reservation terminology to buy-lock terminology after M10

---

## Progress Log
- 2026-03-08:
  - Added legacy-schema compatibility fallbacks across Smart Buy APIs (`reserve`, `affiliate-click`, `pending-purchase`, `mark-purchased`, `mark-received`) so flows continue working when migrations `019-022` are not fully applied.
  - Added owner Undo Received flow: new `POST /api/gifts/[id]/undo-received` endpoint (owner-only, Zod-validated) plus a 12-second undo affordance in owner item cards after marking received.
  - Reworked `/u/[token]/reserve` to Option B guest flow: auto-reserve on entry, then present Buy sheet actions (Buy on store / Reserve only / I bought it elsewhere) with 24-hour hold messaging.
  - Updated public Buy helper text and trigger behavior so Buy always routes through the new Option B reserve flow.
  - Updated guest smoke coverage for the new reserve flow and added `e2e/smart-buy.locking.spec.ts` to validate two-browser reservation locking behavior.
  - Added reserved-lock info sheet behavior in public item actions: tapping Buy on a reserved item now opens a "Gift reserved" sheet with `Reserved until ...` messaging when expiry data is available.
  - Expanded Smart Buy coverage with owner-focused tests (`e2e/smart-buy.owner.spec.ts`) and additional contribution-gating assertions for reserved/received states in `e2e/smart-buy.api.spec.ts`.
  - Added reserve guardrails: per-route rate limiting (`gift-reserve`, fail-open when RPC is unavailable) and per-device active reservation cap (max 3 active reservations).
  - Hardened reservation ownership checks to require `cancelToken` fallback when hashed device-token columns are unavailable.
  - Updated Smart Buy contribution lock checks to avoid missing-column bypasses in `/api/stripe/checkout` and `/u/[token]/contribute` by using compatibility-safe reservation reads.
  - Added optional `cancelToken` support to `/api/gifts/pending-purchase` and wired the public-list client to send it when available for legacy environments.
  - Added Smart Buy analytics event constants and expanded `/api/public-events` validation to accept return-banner and new guest smart-buy/contribution events.
  - Added `guest_contribute_success` audit emission in the Stripe webhook path.
  - Updated Smart Buy API Playwright coverage to pass `cancelToken` through the full reserve/click/mark/cancel lifecycle.
  - Re-ran Smart Buy API tests after compatibility patches: `e2e/smart-buy.api.spec.ts` now passes (3/3).
  - Added `POST /api/gifts/[id]/cancel-reservation` with device-token ownership validation, visibility access checks, and reservation-field cleanup.
  - Added `POST /api/gifts/[id]/mark-purchased` to transition a reservation to `purchased` with `purchased_at` and ownership checks.
  - Added `POST /api/gifts/[id]/mark-received` (owner-only) to mark item `received`, persist received audit fields, and clear active reservation locks.
  - Added `/api/gifts/[id]/contribute/create-session` as the gift-scoped checkout entrypoint and switched `/u/[token]/pay` to use it.
  - Updated reserve/contribution lock logic to treat both `reserved` and `purchased` as blocking states where appropriate.
  - Added migration `021_smart_buy_lock_logic.sql` to update `public_reservation_flags` and `item_is_reserved()` for active reserved windows + purchased locks.
  - Added migration `022_smart_buy_received_audit_columns.sql` for `items.received_at` and `items.received_by_owner_id`.
  - Added `POST /api/gifts/[id]/affiliate-click` to validate reservation ownership by hashed device token, set `affiliate_click_at`, and return final `affiliate_url`.
  - Updated guest reserve redirect flow to call `/api/gifts/[id]/affiliate-click` before outbound navigation and keep the 24-hour reservation active on failure.
  - Added `POST /api/gifts/[id]/reserve` with 24h reservation windows, expired-reservation release-on-reserve, share-token/member access checks, and owner/self-gifting prevention.
  - Added reservation lifecycle fields/indexes in `020_smart_buy_reservation_lifecycle.sql` (`reserved_at`, `reserved_until`, `reserved_by_token_hash`, `affiliate_click_at`, `purchased_at`).
  - Switched public guest reserve flow (`/u/[token]/reserve`) to use the new gift reserve endpoint.
  - Added anonymous guest `deviceToken` bootstrap on first public-list visit with `localStorage` primary storage and cookie fallback.
  - Added hashed `device_token` support in reservation create/cancel API payloads and server-side comparison checks.
  - Added Supabase migration `019_add_reservations_device_token_hash.sql` to persist hashed device tokens without storing raw tokens.
  - Made item title and image clickable in owner and public item cards.
  - Routed those title/image clicks through `/api/go/[itemId]` (with share token in public view).
  - Improved Amazon link-preview reliability for redirected short links by re-detecting Amazon products after final redirect and canonicalizing cache keys.
  - Implemented affiliate provider selection in `/api/go`: Amazon uses direct Associates tag, non-Amazon uses Skimlinks.
  - Added unread notification indicator dots to desktop and mobile app navigation.
  - Ran Playwright correction-pass sanity checks (`smoke.guest` + `smoke.owner`): 10 passed.
  - Updated app-header primary toggle copy from "Create New" to "Create List" and increased profile text sizes for readability.
  - Reworked `/app` dashboard: returning users now see a real list summary (totals + recent lists), while static create-list cards are shown only for first-time users without lists.
  - Added an upcoming-event countdown card on `/app` based on the nearest non-past `event_date`.
  - Improved `/app/lists` hierarchy by splitting owned vs shared sections with section counts and explicit "Shared with me" badge chips on shared cards.
  - Added server-rendered search and scope filters on `/app/lists` (`q` + `scope`) for accounts with many lists.
  - Added list-type icon chips and visibility chips on list cards to make card scanning faster.
  - Updated list share cards to collapse the raw share-link display after first successful copy, with a quick "Show" affordance.
  - Added drag-handle reordering in list detail with server-validated `sort_order` persistence.
  - Added an explicit “Back to lists” affordance on list detail pages.
  - Polished `/app/settings` with actionable quick links (notifications/lists/create), account summary, and cleaner navigation.
  - Added a shared `PageHeader` component and adopted it on `/app/lists` and `/app/settings`.
  - Added a shared `EmptyState` component and adopted it in `/app/lists` and list-detail item-empty states.
  - Added a shared `IconButton` component and replaced one-off edit/delete icon-button markup in item cards.
  - Added a shared `ModalShell` and migrated list share/add-wish modals to the shared backdrop/escape/scroll-lock behavior.
  - Replaced duplicated inline funding progress bars with the shared `ProgressBar` component in owner and public item cards.
  - Consolidated owner/public item-card presentation by extracting shared media and linked-title components.
  - Replaced major one-off action buttons in list detail/add-wish flows with `GlassButton` variants.
  - Extracted reusable dark-form input style constants and adopted them across add/list-settings modals.
  - Standardized the "Most Desired" badge with one shared component across owner and public item cards.
  - Added confirmation micro-interactions on copy actions (success icon, color shift, subtle scale) via the shared `CopyButton`.
  - Removed remaining inline color overrides in auth/list settings/list card UI and replaced them with class-based tokens/utilities.
  - Added Playwright responsive-width coverage at 320/375/768/1024/1366 for authenticated app shell and public list actions, including horizontal-overflow guards.
  - Added structured link-preview request metrics logging (`[link-preview][metric]`) with status/source/error/duration fields across cache, rate-limit, success, and failure branches.
  - Added deterministic link-preview logic tests covering URL normalization, SSRF validation, and JSON-LD parsing edge cases.
  - Added optional email notification fan-out via Resend in the shared notifications library, including safe HTML escaping and best-effort delivery behavior.
  - Added email notification configuration examples to `.env.example` (`RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`).
  - Added centralized error tracking primitives (`trackClientError` / `trackServerError`) with a validated `/api/errors` intake route and app error-boundary integration.
  - Added `docs/RUNBOOK.md` with deploy prechecks, rollback procedure, incident triage, recovery verification, and post-incident follow-up workflow.
  - Added a user bug-report flow: `/app/feedback` form, validated `/api/bug-reports` route, settings quick-link entry point, and API coverage for auth + success paths.
  - Added production-only ops alert forwarding for tracked server errors via `OPS_ALERT_WEBHOOK_URL` in the centralized error-tracking pipeline.
  - Added public legal/compliance pages (`/affiliate-disclosure`, `/privacy`, `/terms`, `/about`, `/contact`) and exposed them from the global footer on public surfaces.
  - Added dynamic public-list metadata/OG tags and HTML-source Playwright coverage verifying `/u/[token]` includes server-rendered merchant links.
  - Added public discovery surfaces: `/explore` and `/@/[username]` (via `/@/:username` rewrite), plus Playwright coverage for public reviewer-facing SEO/legal/discovery flows.
  - Added metadata routes for `robots.txt` and dynamic `sitemap.xml`, plus canonical tags on public pages and verification tests for indexing endpoints.
  - Added JSON-LD structured data on public list/profile pages and extended SEO tests to verify structured-data output in HTML source.
  - Added a persisted cookie-consent banner on public surfaces and Playwright coverage for consent accept/dismiss persistence.
- 2026-03-04:
  - Added DB-backed rate limiting for `/api/link-preview` with hashed client keys, per-window counters, and 429 handling on cache misses.
  - Added Smart Buy task spec under M9 current correction pass, including status model, API contracts, DB fields, UX flow, analytics, guardrails, and required tests.
  - Removed the duplicate Amazon affiliate strategy decision from Open Questions; it remains tracked under the active M9 correction pass.
  - Marked the empty-account create-list branch, `/app/lists/new` polish, and login-page polish as completed after verifying the current routes and UI implementations.
  - Unified add-item entry points behind one product-first modal flow across list detail, empty-list state, and Gift Finder.
- 2026-03-02:
  - Aligned public UX copy from "Reserve" to "Buy this gift" while keeping internal reservation schema/API names unchanged.
  - Implemented "Buy this gift" behavior as lock-first then redirect through `/api/go/[itemId]`.
  - Normalized `project.md` into one backlog.
  - Removed duplicate Skimlinks/public-roadmap items from the main plan by folding them into M10.
  - Resolved documented contradictions around owner buy behavior, public access, and routing strategy.
  - Redirected returning users to `/app/lists` from auth entry routes while preserving direct dashboard access at `/app` and the first-list onboarding page for empty accounts.
- 2026-02-26:
  - Completed UI duplication/risk audit for maintainability and UX consistency.
  - Biggest long-term risk identified as consistency drift, not immediate runtime speed.
- 2026-01-28:
  - Completed public-page glass styling pass and removed owner-only payout controls from visitor view.
- 2026-01-05:
  - Implemented affiliate redirect routing and public affiliate disclosure.
- 2026-01-04:
  - Completed notifications and hardening baseline.
- 2025-01-02:
  - Completed link preview implementation with caching and SSRF protections.
