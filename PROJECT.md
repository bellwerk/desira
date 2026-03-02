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
- [ ] Link preview rate limiting
- [ ] Link preview logging and metrics
- [ ] Link preview tests for normalization, SSRF, and JSON-LD edge cases

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
- [ ] Email notifications

### M7 - Hardening
- [x] Error toasts and loading states
- [x] Basic audit log
- [x] Seed/demo data support
- [x] Security review documentation
- [x] Performance sanity pass on obvious query waterfalls

#### Remaining Hardening Work
- [ ] Rate limit `/api/link-preview`
- [ ] Add centralized error tracking
- [ ] Add production alerting
- [ ] Add rollback/runbook documentation
- [ ] Add user bug-report flow

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
- [ ] Test at 320, 375, 768, 1024, and 1280+ widths

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
- [ ] Remove remaining inline color overrides
- [ ] Show returning-user list summary on `/app`
- [ ] Remove static placeholder sections from dashboard
- [ ] Add upcoming-events countdown
- [ ] Clarify app header primary toggle labels
- [ ] Increase tiny profile text for readability
- [ ] Add unread notification indicator
- [ ] Improve `/app/lists` visual hierarchy
- [ ] Add search/filter when a user has many lists
- [ ] Differentiate "Shared with me" badge styling
- [ ] Add list type thumbnail/icon treatment
- [ ] Collapse share link after first-use emphasis
- [ ] Add drag handles for `sort_order`
- [ ] Improve back navigation affordance
- [ ] Polish `/app/lists/new`
- [ ] Polish login page
- [ ] Polish `/app/settings`
- [ ] Create shared `PageHeader`
- [ ] Create shared `EmptyState`
- [ ] Create shared `IconButton`
- [ ] Extract shared modal shell
- [ ] Consolidate duplicated owner/public item-card presentation
- [ ] Replace remaining one-off button styles with `GlassButton` variants
- [ ] Extract shared dark-form input styles
- [ ] Replace equivalent inline progress markup with `ProgressBar`
- [ ] Standardize "Most Desired" badge treatment
- [ ] Add lightweight micro-interactions where they improve confirmation

#### Current Correction Pass
- [x] Move app navigation to a bottom bar on mobile while preserving desktop sidebar
- [ ] Route returning users from `/app` to `/app/lists` when they already have lists
- [ ] Unify the add-item flow behind one product-first flow
- [ ] If the user has no lists, branch cleanly into create-list first
- [ ] Make item title and image clickable in owner and public views
- [ ] Route all product clicks through `/api/go/[itemId]` in owner and public views
- [ ] Improve Amazon URL handling and preview reliability
- [ ] Decide Amazon affiliate strategy:
  - [ ] Option A: Skimlinks for Amazon too
  - [ ] Option B: direct Amazon Associates for Amazon, Skimlinks for non-Amazon
- [ ] Validate correction pass with manual sanity checks

### M10 - Publisher Approval And Public Growth
This milestone replaces the duplicate Skimlinks track. It is the single roadmap for crawlable public commerce pages, compliance, and reviewer readiness.

#### M10.1 Public Surfaces
- [ ] Confirm `/u/[token]` is server-rendered with merchant links present in HTML source
- [ ] Add metadata and OG tags to public list pages
- [ ] Add public profile page at `/@/[username]`
- [ ] Add `/explore` with featured and recent public lists
- [ ] Add discoverable footer/navigation paths to public surfaces
- [ ] Optionally add `/l/[slugOrId]` only if aliasing materially helps SEO or reviewer clarity

#### M10.2 Compliance And Trust
- [ ] Add `/affiliate-disclosure`
- [ ] Add `/privacy`
- [ ] Add `/terms`
- [ ] Add `/about`
- [ ] Add `/contact`
- [ ] Add cookie consent if required by the final affiliate script implementation
- [ ] Ensure disclosure and legal links are visible from public pages/footer

#### M10.3 Demo Content And Approval Readiness
- [ ] Seed 5-10 Desira-owned public demo lists
- [ ] Ensure each demo list has enough real merchant links to demonstrate commercial intent
- [ ] Remove all placeholder content from reviewer-visible pages
- [ ] Prepare 6-8 submission URLs for reapplication

#### M10.4 SEO And QA
- [ ] Add sitemap for public lists and public profiles
- [ ] Confirm `robots.txt`
- [ ] Add canonical tags on public pages
- [ ] Add structured data if useful
- [ ] Add Playwright coverage for public reviewer flows

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
- [ ] Typecheck passes
- [ ] Build passes
- [ ] Lint passes
- [ ] No secrets or PII in logs
- [ ] RLS reviewed for touched tables/routes
- [ ] Zod or equivalent server validation for touched mutations
- [ ] Buy-lock/contribute exclusivity still enforced
- [ ] Happy path tested
- [ ] At least one failure path tested
- [ ] No placeholder content on any user-facing page touched by the work

---

## Open Questions Requiring A Decision
- [ ] Amazon affiliate strategy: Skimlinks-only vs split routing
- [ ] Whether to add `/l/[slugOrId]` as an alias after `/u/[token]` public pages are validated
- [ ] Whether contributor identity reveal belongs in MVP+1 or later
- [ ] Whether to run a full internal rename from reservation terminology to buy-lock terminology after M10

---

## Progress Log
- 2026-03-02:
  - Aligned public UX copy from "Reserve" to "Buy this gift" while keeping internal reservation schema/API names unchanged.
  - Implemented "Buy this gift" behavior as lock-first then redirect through `/api/go/[itemId]`.
  - Normalized `project.md` into one backlog.
  - Removed duplicate Skimlinks/public-roadmap items from the main plan by folding them into M10.
  - Resolved documented contradictions around owner buy behavior, public access, and routing strategy.
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
