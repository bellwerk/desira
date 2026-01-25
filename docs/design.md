# Desira — Design System (UI/UX Reference)

This doc is the single source of truth for Desira UI/UX.  
Every new screen/component must follow these rules unless this doc is updated first.

---

## 1) Design North Star

**Liquid Glass:** frosted translucency + soft depth + calm typography + one strong backdrop.

Non-negotiables:
- **Content first:** gifts/items are the hero; UI chrome stays quiet.
- **Glass is consistent:** only 3 elevations (Glass-1/2/3). No custom one-offs.
- **One backdrop at a time:** gradient OR photo OR neutral grid. Never competing layers.
- **Privacy by design:** reserver identity + purchase details are never shown to others.
- **Rules are visible in UI:** mutually exclusive actions should be obvious (disabled states + microcopy).
- **Fast, soft motion:** subtle transitions, springy feel, no flashy effects.

---

## 2) Tokens

### 2.1 Spacing (8pt grid)
- 4, 8, 12, 16, 24, 32, 40, 48

### 2.2 Radius
- Cards / panels: 24–32
- Inputs: 18–24
- Chips: 999 (pill)

### 2.3 Typography (Inter or system)
- H1: 40 / 1.1 / 600
- H2: 28 / 1.15 / 600
- H3: 20 / 1.2 / 600
- Body: 16 / 1.45 / 400
- Meta: 13 / 1.35 / 400

### 2.4 Color strategy
- UI is mostly neutral + **one accent** (used for primary actions + focus states).
- Semantic colors are muted (never neon).
- Avoid “multiple UI colors” competing on the same screen.

### 2.5 Glass elevations (only these)
**Glass-1 (Cards / panels)**
- blur 14–18px
- light fill ~ 0.60–0.70 alpha
- border 1px white @ 12–20% opacity
- soft shadow (wide, low contrast)

**Glass-2 (Popovers / menus / modals)**
- blur 20–28px
- slightly denser fill than Glass-1
- inner rim highlight (top/left)

**Glass-3 (Sticky composer / bottom bars)**
- blur 28–36px
- densest fill for legibility
- optional faint tint gradient

### 2.6 Motion
- Hover/focus: 120–160ms
- Sheets/menus: 180–240ms
- Animate: opacity, transform (Y), blur (subtle)
- Avoid: heavy scaling, bounce cartoon easings
- Respect `prefers-reduced-motion`

---

## 3) Backdrop Modes

Pick ONE per screen (or per section if clearly separated):

1) **Gradient Field** (marketing/empty states)
- soft multi-color blur, minimal noise overlay

2) **Photo Cover** (public list pages)
- single strong image, add overlay for readability

3) **Neutral Grid** (settings/admin/dense screens)
- subtle grid texture, calm and premium

---

## 4) Accessibility Baseline

- Text must remain readable on glass (don’t rely on blur alone).
- Focus ring always visible (accent ring).
- Buttons/links must have clear hover + active states.
- Avoid ultra-low contrast dividers inside glass.

---

## 5) Core Business Rules → UI Rules

### 5.1 Mutual exclusivity (MVP)
- If **funded_amount_cents > 0**: **Reserve is disabled** + show why.
- If **Reserved**: **Contribute is disabled** + show why.

### 5.2 Privacy
- Anyone viewing items sees only: **Available / Reserved / Funded**.
- Never show:
  - who reserved
  - “what exactly was bought”
  - checkout/receipt details
- Owners can optionally see contributor list later (P1); MVP default is minimal.

### 5.3 Self-gifting prevention
- List owner view is **read-only** (no Reserve/Contribute CTAs).
- Replace actions with a subtle label: “You own this list.”

---

## 6) Components (catalog)

Every component must define:
- Variants
- States (default/hover/pressed/focus/disabled/loading)
- When to use
- When NOT to use

### 6.1 GlassCard
Purpose: default container for item/list blocks.

Variants:
- `default` (Glass-1)
- `interactive` (hover/press)
- `dense` (compact padding)

Rules:
- Always: blur + translucent fill + 1px border + subtle rim highlight.
- No heavy outlines or harsh shadows.

### 6.2 GlassButton
Variants:
- `primary` (accent-tinted glass)
- `secondary` (neutral glass)
- `ghost` (text/icon only, hover wash)

States:
- Disabled must clearly show (lower contrast + no hover).

### 6.3 BadgeChip
Used for: `Available`, `Reserved`, `Funded`, `Owner`, `Private`, `Unlisted`.

Rules:
- Muted colors, small type, pill radius.
- Must remain readable on glass.

### 6.4 ContextMenu / PopoverMenu (Glass-2)
Used for secondary actions: Edit, Duplicate, Share, Delete.
- Dividers are hairlines.
- Destructive action is only red text/icon (background stays glass).

### 6.5 BottomSheet / Modal (Glass-2)
- Mobile: prefer BottomSheet
- Desktop: modal centered, max width, strong close affordance

### 6.6 Inputs
- Use glass input containers.
- Placeholder must be readable.
- Validation errors: short + human.

### 6.7 ItemCard (MVP hero)
Shows:
- title
- domain (from URL) if present
- price estimate (optional)
- status chip
- optional progress bar (funded)

Actions:
- Non-owner: Reserve / Contribute (depending on state)
- Owner: no actions

### 6.8 ProgressBar (funded)
- Thin track
- Muted tinted fill
- Label: “$X of $Y”

### 6.9 Toast
- Glass-2 small panel
- Used for: reserved, contributed, copied link, errors

### 6.10 LinkPreviewCard (M3)
When URL is pasted:
- Debounce ~500ms
- Loading skeleton → Preview card (image + title + domain + price if found)
- Autofill editable fields
- Failure never blocks saving

---

## 7) Screen Templates (reference layouts)

### 7.1 Authenticated App Shell (`/app`)
- Left: sidebar (lists)
- Top: minimal header (account menu)
- Main: content panel (Glass-1 sections)

### 7.2 Lists Screen (`/app/lists`)
- Primary: “Create list” (GlassButton primary)
- List tiles: GlassCard interactive

### 7.3 List Detail (`/app/lists/[id]`)
Header:
- title + visibility chip + share button
Body:
- items grid/list (ItemCard)
- “Add item” opens modal/sheet

Owner mode:
- read-only messaging
- hide Reserve/Contribute CTAs

### 7.4 Public List (`/l/[token]`)
Backdrop: Photo Cover OR Gradient Field
Top: Glass header card (title, occasion, date)
Items: Glass stack
Actions:
- Reserve / Contribute available to non-owner
- Privacy preserved

### 7.5 Reserve flow (MVP)
CTA: “Reserve”
Confirm:
- minimal form only if needed (name/email optional depending on product choice)
Result:
- toast “Reserved”
- item shows chip “Reserved”
- contribute disabled with helper text

### 7.6 Contribute flow (Stripe)
CTA: “Contribute”
Sheet:
- amount selector + optional message + anonymity toggle (if enabled)
Result:
- toast “Thanks — contribution received”
- item shows progress + reserve disabled with helper text

### 7.7 Invite flow
- “Invite” button → sheet:
  - Copy link (primary)
  - Email invite (later)
- Accept invite page uses same glass language (simple, calm)

---

## 8) Voice & Copy (microcopy rules)

Tone: playful but premium. Short sentences. No cringe.

Labels:
- Reserve
- Contribute
- Copy link
- Share list
- Add item
- Private / Unlisted / Public

Helper text (examples):
- “Can’t reserve — this item already has contributions.”
- “Can’t contribute — this item is reserved.”
- “You own this list.”

Error style:
- “Couldn’t fetch details. You can still add this item manually.”

---

## 9) Implementation Notes (for dev consistency)

- Use shadcn/ui primitives, but style via **glass classes** only.
- No ad-hoc shadows/blur values inside components.
- All new UI must be built from: GlassCard, GlassButton, BadgeChip, PopoverMenu, BottomSheet/Modal.

Recommended: define `glass-1/2/3` as global classes (see snippet below).

