# Desira Security Model

This document summarizes the security controls in place for the Desira MVP.

## Defense in Depth Strategy

Desira uses a layered security approach:
1. **Supabase RLS** (Row Level Security) — enforced at the database level
2. **Server-side validation** — API routes check permissions before mutations
3. **Input validation** — Zod schemas validate all incoming data
4. **Secrets protection** — Stripe and DB credentials never exposed to client

---

## Table-by-Table RLS Coverage

### `lists`
| Operation | Policy | Notes |
|-----------|--------|-------|
| SELECT | Members can view lists they belong to | Requires `list_members` entry with `status='accepted'` |
| INSERT | Authenticated users | Owner automatically added to `list_members` via application logic |
| UPDATE | Members only | Via `list_members` check |
| DELETE | Members only | Via `list_members` check |

**Migration:** `005_m2_rls_hardening.sql`

### `items`
| Operation | Policy | Notes |
|-----------|--------|-------|
| SELECT (authenticated) | Members of the list | |
| SELECT (anon) | Public/unlisted lists only | Visibility check on parent list |
| INSERT | Members only | |
| UPDATE | Members only | |
| DELETE | Members only | |

**Migration:** `005_m2_rls_hardening.sql`

### `reservations`
| Operation | Policy | Notes |
|-----------|--------|-------|
| SELECT | Members can view | Identity hidden via `public_reservation_flags` view |
| INSERT | Via service role only | API route handles validation |
| UPDATE | Via service role only | Cancel token validated in API |

**DB Trigger:** `check_reservation_before_insert` blocks if contributions exist

**Migration:** `005_m2_rls_hardening.sql`

### `contributions`
| Operation | Policy | Notes |
|-----------|--------|-------|
| SELECT | Members can view | Totals exposed via `public_contribution_totals` view |
| INSERT | Via service role only | Stripe webhook handles insertion |
| UPDATE | Via service role only | |

**DB Trigger:** `check_contribution_before_insert` blocks if item is reserved

**Migration:** `005_m2_rls_hardening.sql`

### `payment_accounts`
| Operation | Policy | Notes |
|-----------|--------|-------|
| All | Via service role only | Sensitive Stripe data |

### `audit_events`
| Operation | Policy | Notes |
|-----------|--------|-------|
| All | Via service role only | Admin-only audit log |

**Migration:** `007_audit_events.sql`

---

## Server-Side Checks (API Routes)

### `/api/reservations` (POST)
- ✅ Validates item exists and is `active`
- ✅ Validates list allows reservations
- ✅ Validates list is not private
- ✅ Blocks if contributions exist (mutual exclusivity)
- ✅ Blocks self-gifting (owner cannot reserve own items)
- ✅ Uses `supabaseAdmin` for insert

### `/api/reservations` (PATCH - cancel)
- ✅ Validates cancel token matches hash
- ✅ Validates reservation is in `reserved` status

### `/api/stripe/checkout` (POST)
- ✅ Validates item exists and belongs to list (via share token)
- ✅ Validates list allows contributions
- ✅ Validates list is not private
- ✅ Blocks if item is reserved (mutual exclusivity)
- ✅ Blocks if item is already fully funded
- ✅ Blocks self-gifting (owner cannot contribute to own items)
- ✅ Validates recipient has active Stripe Connect account
- ✅ Computes fee/total server-side (never trusts client amounts)

### `/api/stripe/webhook` (POST)
- ✅ Validates Stripe signature
- ✅ Uses idempotency (unique `provider_payment_intent_id`)
- ✅ Handles duplicate webhook calls gracefully

### `/api/stripe/connect` (POST)
- ✅ Requires authenticated user
- ✅ Creates Stripe account for correct user only

---

## Business Rules Enforcement

### Mutual Exclusivity (Reserve vs Contribute)
- **Rule:** An item cannot be reserved if it has contributions, and vice versa
- **Enforcement:**
  1. DB triggers (`check_reservation_before_insert`, `check_contribution_before_insert`)
  2. Server checks in `/api/reservations` and `/api/stripe/checkout`
  3. UI disables buttons based on state

### Self-Gifting Prevention
- **Rule:** List owners cannot reserve or contribute to their own list items
- **Enforcement:**
  1. Server checks in `/api/reservations` and `/api/stripe/checkout`
  2. UI hides reserve/contribute buttons for owners (`ItemActions.tsx`)

---

## Secret Management

| Secret | Location | Client Exposed? |
|--------|----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | ❌ Never |
| `STRIPE_SECRET_KEY` | `.env.local` | ❌ Never |
| `STRIPE_WEBHOOK_SECRET` | `.env.local` | ❌ Never |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | ✅ Yes (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | ✅ Yes (public, safe with RLS) |

---

## Input Validation

All API routes use Zod schemas:
- `/api/reservations` — `CreateSchema`, `CancelSchema`
- `/api/stripe/checkout` — `BodySchema`
- `/api/link-preview` — URL validation + SSRF protection

---

## SSRF Protection (Link Preview)

The link preview feature (`/api/link-preview`) includes:
- ✅ Only allows `http://` and `https://` protocols
- ✅ Blocks localhost and private IP ranges
- ✅ DNS resolution with IP re-validation
- ✅ Redirect limit (≤5 hops)
- ✅ Request timeout (6-8s)
- ✅ Response size limit (1-2MB)

---

## Audit Logging

Key actions are logged to `audit_events` table:
- `reservation.created` / `reservation.canceled`
- `contribution.succeeded` / `contribution.failed`
- Additional events can be added as needed

---

## Recommendations for Production

Before going live:
1. [ ] Enable Supabase Auth rate limiting
2. [ ] Add rate limiting to `/api/link-preview`
3. [ ] Set up Stripe webhook retry handling
4. [ ] Configure CSP headers
5. [ ] Enable Supabase database backups
6. [ ] Review and test all RLS policies with different user roles

