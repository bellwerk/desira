# Merchant Support Matrix

This matrix tracks current link-preview behavior for high-priority merchants in Batch 3.1.

Related:
- `docs/MARKETPLACE_COVERAGE.md` for Batch 3.4 status, relevance priority, and affiliate readiness.

Audit scope:
- Link preview fetch + parser behavior in `POST /api/link-preview`
- Current fallback path: manual entry (URL/title/image/price)
- Amazon includes PA-API assist when configured

## Matrix

| Merchant | Sample URL | Fetch Result | Parser Result | Failure Reason | Fallback Requirement | Behavior Class |
|---|---|---|---|---|---|---|
| Amazon | https://www.amazon.com/dp/B0CHWRXH8B | Partial | Partial | Dynamic content and anti-bot controls can hide price/image without PA-API. | Manual image or price entry may be required. | JS-heavy parseable |
| Walmart | https://www.walmart.com/ip/1444358946 | Success | Partial | Metadata exists, but price/image can vary by region/session. | Manual image or price entry may be required. | static HTML parseable |
| Target | https://www.target.com/p/lego-iconic-red-2-in-1-brick-pouch/-/A-87942080 | Success | Partial | Hydrated product payload may omit complete metadata in HTML snapshot. | Manual image or price entry may be required. | JS-heavy parseable |
| Etsy | https://www.etsy.com/listing/1601209480/custom-name-necklace | Success | Success | Generally reliable metadata; occasional listing-level gaps. | No fallback required. | static HTML parseable |
| eBay | https://www.ebay.com/itm/204271160566 | Partial | Partial | Listing markup varies; bot checks can degrade extracted fields. | Manual image or price entry may be required. | static HTML parseable |
| AliExpress | https://www.aliexpress.com/item/1005006042648655.html | Blocked | Failed | Preview traffic is frequently blocked; affiliate/API approach is more reliable. | Affiliate/API integration required for reliable automation. | affiliate/API-only |
| Temu | https://www.temu.com/goods.html?_bg_fs=1&goods_id=601099517642834 | Blocked | Failed | Challenge pages and anti-bot controls block automated fetches. | Manual URL/title/image/price entry required. | anti-bot/captcha blocked |
| Shein | https://us.shein.com/SHEIN-SXY-Letter-Graphic-Drop-Shoulder-Tee-p-35035195-cat-1738.html | Blocked | Failed | Anti-bot gating plus dynamic rendering prevents stable metadata extraction. | Manual URL/title/image/price entry required. | anti-bot/captcha blocked |
| Zara | https://www.zara.com/us/en/soft-knit-sweater-p04331110.html | Partial | Partial | JS-first storefront; server HTML often lacks complete metadata fields. | Manual image or price entry may be required. | JS-heavy parseable |
| H&M | https://www2.hm.com/en_us/productpage.1218279001.html | Partial | Partial | Hydration-heavy rendering can omit stable title/image/price metadata in HTML. | Manual image or price entry may be required. | JS-heavy parseable |
| Wayfair | https://www.wayfair.com/furniture/pdp/wade-logan-kylan-velvet-upholstered-task-chair-w005484058.html | Success | Partial | Primary metadata is available, but variant pricing can be incomplete. | Manual image or price entry may be required. | static HTML parseable |
| Best Buy | https://www.bestbuy.com/site/6536404.p | Partial | Partial | JS dependency and occasional anti-bot controls reduce parser completeness. | Manual image or price entry may be required. | JS-heavy parseable |
| Costco | https://www.costco.com/sony-wh-1000xm5-wireless-noise-canceling-headphones.product.4000043502.html | Blocked | Failed | Bot detection and membership-first pages frequently block preview fetches. | Manual URL/title/image/price entry required. | anti-bot/captcha blocked |
| Specialized | https://www.specialized.com/us/en/align-ii/p/1000208083 | Success | Success | Generally reliable static metadata; occasional image CDN misses. | No fallback required. | static HTML parseable |

## Logging

Failures now emit a human-readable structured log line:

- Tag: `[link-preview][merchant-failure]`
- Includes: `domain`, `merchant`, `behavior_class`, `fetch_result`, `parser_result`, `failure_reason`, `fallback_requirement`, and failure phase (`fetch` or `parse`)
