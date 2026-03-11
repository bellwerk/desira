# Marketplace Coverage Table

This is the Batch 3.4 source-of-truth table for merchant parsing and affiliate readiness.

Notes:
- Priority is ordered by current user relevance for US-focused traffic.
- Commission estimates are intentionally marked unknown until partner-level terms are finalized.
- Parsing support and merchant behavior details are maintained in `src/lib/link-preview/merchant-support.ts`.

| Priority | Merchant | Region relevance | Parsing support | Fetch method | Affiliate availability | Commission estimate | Notes/blockers | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Amazon | Very high (US/CA) | Partial (JS-heavy parseable) | Amazon PA-API first, then HTML fallback | Amazon Associates (direct tag) | Unknown (program-dependent) | Some pages still require manual image/price due to anti-bot/dynamic rendering. | Partial |
| 2 | Walmart | Very high (US) | Partial (static HTML parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Region and session differences can hide price/image fields. | Partial |
| 3 | Target | Very high (US) | Partial (JS-heavy parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Hydration-heavy pages can reduce parser completeness. | Partial |
| 4 | Etsy | High (US/global) | Full (static HTML parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Generally reliable; occasional listing-level metadata gaps. | Supported |
| 5 | eBay | High (US/global) | Partial (static HTML parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Markup variance and occasional block responses degrade parsing. | Partial |
| 6 | Best Buy | High (US/CA) | Partial (JS-heavy parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | JS-heavy content and occasional anti-bot blocks. | Partial |
| 7 | Costco | High (US/CA) | Failed (anti-bot/captcha blocked) | Direct HTML fetch (frequently blocked) | Skimlinks pass-through (conversion uncertain) | Unknown (program-dependent) | Membership-first and anti-bot pages often block fetch attempts. | Manual fallback |
| 8 | Wayfair | Medium-high (US/CA) | Partial (static HTML parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Variant-level pricing may be missing from parsed output. | Partial |
| 9 | AliExpress | Medium (global) | Failed (affiliate/API-only) | Direct HTML fetch (frequently blocked) | No dedicated integration yet (API/program pending) | Unknown (program-dependent) | Requires explicit affiliate/API integration for reliable coverage. | Unsupported |
| 10 | Temu | Medium (US/global) | Failed (anti-bot/captcha blocked) | Direct HTML fetch (challenge pages) | Skimlinks pass-through (conversion uncertain) | Unknown (program-dependent) | Anti-bot/captcha behavior blocks automated preview extraction. | Manual fallback |
| 11 | Shein | Medium (US/global) | Failed (anti-bot/captcha blocked) | Direct HTML fetch (challenge pages) | Skimlinks pass-through (conversion uncertain) | Unknown (program-dependent) | Dynamic storefront + anti-bot gating limits parser reliability. | Manual fallback |
| 12 | Zara | Medium (US/global) | Partial (JS-heavy parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | JS-first product pages may omit complete metadata in HTML. | Partial |
| 13 | H&M | Medium (US/global) | Partial (JS-heavy parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Hydration-driven rendering can hide price/image fields. | Partial |
| 14 | Specialized | Medium (US/global niche) | Full (static HTML parseable) | Direct HTML fetch + metadata parse | Skimlinks (best-effort) | Unknown (program-dependent) | Mostly parseable; occasional CDN image misses. | Supported |
