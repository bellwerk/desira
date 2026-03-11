# Implementation Batches Tracker

This file converts reported issues into manageable implementation batches.

## Batch 1 - Stabilize Core Flows (P1)
Goal: Remove blocking bugs in core owner/navigation flows.

### 1.1 Item status enum mismatch
- [ ] Inspect DB `item_status` enum values.
- [x] Compare enum values with frontend status payloads.
- [ ] Confirm whether `received` exists in DB schema.
- [ ] Fix by either:
- [x] adding `received` to enum, or
- [x] mapping UI action to valid enum value.
- [x] Verify server actions/API/mutations send valid status values.
- [ ] E2E test owner flow:
- [ ] add item
- [ ] mark purchased/reserved
- [ ] mark received
- [ ] reload and confirm persistence.
- [x] Confirm guest vs owner logic stays consistent with the same status model.

### 1.2 Sidebar overlap
- [x] Audit sidebar width + main content container offsets.
- [x] Fix layout so content accounts for sidebar width (no ad hoc padding hacks).
- [ ] Validate collapsed/expanded sidebar states.
- [x] Validate desktop, tablet, mobile.
- [ ] Validate long content + narrow viewport behavior.
- [x] Validate z-index/layering so content is not hidden.

### 1.3 Share CTA behavior
- [x] Separate actions: `Share list` vs `Preview public list`.
- [x] Set primary action to copy public link.
- [x] Support native share sheet where available.
- [x] Add success feedback:
- [x] Link copied
- [x] Share sheet opened.
- [x] Validate owner flow on desktop + mobile.
- [x] Rename CTA if current label is misleading.

### 1.4 Existing lists on app open
- [x] Audit post-login/first-open routing.
- [x] Detect whether user already has lists.
- [x] Returning users: route to list overview/recent lists.
- [x] New users only: show onboarding/empty state.
- [x] Ensure clear first actions: continue editing, share, create new list.

## Batch 2 - UX/UI Polish (P2)
Goal: Improve readability and tone without changing core architecture.

### 2.1 First-name greeting only
- [x] Extract first name from profile display name.
- [x] Add fallbacks for single-word or missing names.
- [x] Validate capitalization/punctuation.
- [x] Test: full name, single word, empty name.

### 2.2 Gift Control text contrast
- [x] Inspect color tokens/classes in Wishlist Settings -> Gift Control.
- [x] Fix contrast for:
- [x] Buy marks
- [x] Contributions
- [x] Anonymous givers.
- [x] Validate default/hover/active/disabled states.
- [x] Validate in all supported themes.

## Batch 3 - Merchant Reliability + Affiliate Coverage (P3)
Goal: Make merchant handling robust with clear support boundaries.

### 3.1 Merchant fetch audit + support matrix
- [x] Create merchant support matrix.
- [x] For each merchant, capture:
- [x] sample URL
- [x] fetch result
- [x] parser result
- [x] failure reason
- [x] fallback requirement.
- [x] Classify by behavior:
- [x] static HTML parseable
- [x] JS-heavy parseable
- [x] anti-bot/captcha blocked
- [x] affiliate/API-only.
- [x] Add human-readable failure logging.

### 3.2 Manual fallback flow (required)
- [x] Ensure parse failures still allow manual entry:
- [x] URL
- [x] title
- [x] image
- [x] price.
- [x] Add clear UI guidance when auto-fetch fails.

### 3.3 AliExpress affiliate integration
- [ ] Select affiliate platform/program.
- [ ] Define link generation strategy:
- [ ] backend auto-convert, or
- [ ] on-demand generation.
- [ ] Add AliExpress URL test coverage.
- [ ] Verify attribution + redirect behavior.
- [ ] Document known limitations.

### 3.4 Marketplace coverage table
- [x] Build source-of-truth table with columns:
- [x] Merchant
- [x] Region relevance
- [x] Parsing support
- [x] Fetch method
- [x] Affiliate availability
- [x] Commission estimate
- [x] Notes/blockers.
- [x] Status-tag each merchant: Supported, Partial, Unsupported, Manual fallback.
- [x] Prioritize by user relevance.
- [x] Seed list: Amazon, Walmart, Target, Etsy, eBay, AliExpress, Temu, Shein, Zara, H&M, Wayfair, Best Buy, Costco, Specialized.

## Batch 4 - Accessibility Baseline (P4)
Goal: Reach reliable WCAG AA text contrast baseline.

### 4.1 Full AA contrast audit
- [x] Audit major screens/components.
- [x] Check contrast for:
- [x] primary/secondary text
- [x] button labels
- [x] links
- [x] form labels/placeholders
- [x] error/success messages
- [x] settings panels
- [x] menu items
- [x] public share views.
- [x] Fix failing color pairs.
- [x] Update design tokens where required.
- [x] Re-test after fixes.
- [x] Confirm normal and interactive text are readable in all states.

## Labels
- `bug`
- `ux`
- `ui`
- `accessibility`
- `merchant-fetching`
- `affiliate`
- `high-priority`
- `needs-spec`

## Definition of Done
- [ ] Root cause fixed (not masked).
- [ ] Affected flow tested end-to-end.
- [ ] Desktop + mobile validated where relevant.
- [ ] UI text and feedback states polished.
- [ ] Reliable fallback exists where automation is not guaranteed.
- [ ] Accessibility verified for touched components.

## Optional Follow-ups
- [ ] Internal merchant diagnostics page.
- [ ] Reusable parser test fixtures by merchant.
- [ ] Analytics for failed fetch attempts by domain.
- [ ] Internal "supported stores" reference for product strategy.
