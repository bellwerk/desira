import { extractDomain } from "@/lib/url";

export type MerchantBehaviorClass =
  | "static_html_parseable"
  | "js_heavy_parseable"
  | "anti_bot_captcha_blocked"
  | "affiliate_api_only";

export type MerchantFetchResult = "success" | "partial" | "blocked";

export type MerchantParserResult = "success" | "partial" | "failed";

export type MerchantFallbackRequirement =
  | "none"
  | "manual_image_or_price"
  | "manual_full_entry"
  | "affiliate_api_integration_required";

export interface MerchantSupportEntry {
  merchant: string;
  domains: string[];
  sampleUrl: string;
  fetchResult: MerchantFetchResult;
  parserResult: MerchantParserResult;
  failureReason: string;
  fallbackRequirement: MerchantFallbackRequirement;
  behavior: MerchantBehaviorClass;
}

export type MarketplaceSupportStatus = "Supported" | "Partial" | "Unsupported" | "Manual fallback";

export interface MarketplaceCoverageEntry {
  merchant: string;
  regionRelevance: string;
  parsingSupport: string;
  fetchMethod: string;
  affiliateAvailability: string;
  commissionEstimate: string;
  notesBlockers: string;
  statusTag: MarketplaceSupportStatus;
  userRelevanceRank: number;
}

export const MERCHANT_SUPPORT_MATRIX: MerchantSupportEntry[] = [
  {
    merchant: "Amazon",
    domains: ["amazon.com", "amazon.ca"],
    sampleUrl: "https://www.amazon.com/dp/B0CHWRXH8B",
    fetchResult: "partial",
    parserResult: "partial",
    failureReason: "Dynamic content and anti-bot controls can hide price or image without PA-API.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "js_heavy_parseable",
  },
  {
    merchant: "Walmart",
    domains: ["walmart.com"],
    sampleUrl: "https://www.walmart.com/ip/1444358946",
    fetchResult: "success",
    parserResult: "partial",
    failureReason: "Product metadata is available, but price/image can vary by region and session.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "static_html_parseable",
  },
  {
    merchant: "Target",
    domains: ["target.com"],
    sampleUrl: "https://www.target.com/p/lego-iconic-red-2-in-1-brick-pouch/-/A-87942080",
    fetchResult: "success",
    parserResult: "partial",
    failureReason: "Hydrated product payload may omit complete metadata in server HTML snapshots.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "js_heavy_parseable",
  },
  {
    merchant: "Etsy",
    domains: ["etsy.com"],
    sampleUrl: "https://www.etsy.com/listing/1601209480/custom-name-necklace",
    fetchResult: "success",
    parserResult: "success",
    failureReason: "Generally reliable; occasional listing-level metadata gaps.",
    fallbackRequirement: "none",
    behavior: "static_html_parseable",
  },
  {
    merchant: "eBay",
    domains: ["ebay.com"],
    sampleUrl: "https://www.ebay.com/itm/204271160566",
    fetchResult: "partial",
    parserResult: "partial",
    failureReason: "Markup and metadata vary by listing type; bot checks can degrade fields.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "static_html_parseable",
  },
  {
    merchant: "AliExpress",
    domains: ["aliexpress.com"],
    sampleUrl: "https://www.aliexpress.com/item/1005006042648655.html",
    fetchResult: "blocked",
    parserResult: "failed",
    failureReason: "Preview traffic is frequently blocked; affiliate/API integration is more reliable.",
    fallbackRequirement: "affiliate_api_integration_required",
    behavior: "affiliate_api_only",
  },
  {
    merchant: "Temu",
    domains: ["temu.com"],
    sampleUrl: "https://www.temu.com/goods.html?_bg_fs=1&goods_id=601099517642834",
    fetchResult: "blocked",
    parserResult: "failed",
    failureReason: "Strong anti-bot and challenge pages block automated HTML preview fetches.",
    fallbackRequirement: "manual_full_entry",
    behavior: "anti_bot_captcha_blocked",
  },
  {
    merchant: "Shein",
    domains: ["shein.com"],
    sampleUrl: "https://us.shein.com/SHEIN-SXY-Letter-Graphic-Drop-Shoulder-Tee-p-35035195-cat-1738.html",
    fetchResult: "blocked",
    parserResult: "failed",
    failureReason: "Frequent anti-bot gating and dynamic rendering prevent reliable metadata extraction.",
    fallbackRequirement: "manual_full_entry",
    behavior: "anti_bot_captcha_blocked",
  },
  {
    merchant: "Zara",
    domains: ["zara.com"],
    sampleUrl: "https://www.zara.com/us/en/soft-knit-sweater-p04331110.html",
    fetchResult: "partial",
    parserResult: "partial",
    failureReason: "JS-first storefront; server HTML often lacks complete metadata fields.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "js_heavy_parseable",
  },
  {
    merchant: "H&M",
    domains: ["hm.com"],
    sampleUrl: "https://www2.hm.com/en_us/productpage.1218279001.html",
    fetchResult: "partial",
    parserResult: "partial",
    failureReason: "Hydration-heavy rendering can omit stable title/image/price metadata in HTML.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "js_heavy_parseable",
  },
  {
    merchant: "Wayfair",
    domains: ["wayfair.com"],
    sampleUrl: "https://www.wayfair.com/furniture/pdp/wade-logan-kylan-velvet-upholstered-task-chair-w005484058.html",
    fetchResult: "success",
    parserResult: "partial",
    failureReason: "Primary metadata is available but some product variants hide final pricing details.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "static_html_parseable",
  },
  {
    merchant: "Best Buy",
    domains: ["bestbuy.com"],
    sampleUrl: "https://www.bestbuy.com/site/6536404.p",
    fetchResult: "partial",
    parserResult: "partial",
    failureReason: "High JS dependency and occasional anti-bot controls reduce parser completeness.",
    fallbackRequirement: "manual_image_or_price",
    behavior: "js_heavy_parseable",
  },
  {
    merchant: "Costco",
    domains: ["costco.com"],
    sampleUrl: "https://www.costco.com/sony-wh-1000xm5-wireless-noise-canceling-headphones.product.4000043502.html",
    fetchResult: "blocked",
    parserResult: "failed",
    failureReason: "Bot detection and membership-first pages frequently block automated preview fetches.",
    fallbackRequirement: "manual_full_entry",
    behavior: "anti_bot_captcha_blocked",
  },
  {
    merchant: "Specialized",
    domains: ["specialized.com"],
    sampleUrl: "https://www.specialized.com/us/en/align-ii/p/1000208083",
    fetchResult: "success",
    parserResult: "success",
    failureReason: "Generally reliable static metadata with occasional media-cdn image misses.",
    fallbackRequirement: "none",
    behavior: "static_html_parseable",
  },
];

export const MERCHANT_SEED_LIST = [
  "Amazon",
  "Walmart",
  "Target",
  "Etsy",
  "eBay",
  "AliExpress",
  "Temu",
  "Shein",
  "Zara",
  "H&M",
  "Wayfair",
  "Best Buy",
  "Costco",
  "Specialized",
] as const;

const BEHAVIOR_LABEL: Record<MerchantBehaviorClass, string> = {
  static_html_parseable: "static HTML parseable",
  js_heavy_parseable: "JS-heavy parseable",
  anti_bot_captcha_blocked: "anti-bot/captcha blocked",
  affiliate_api_only: "affiliate/API-only",
};

const FALLBACK_LABEL: Record<MerchantFallbackRequirement, string> = {
  none: "No fallback required.",
  manual_image_or_price: "Manual image or price entry may be required.",
  manual_full_entry: "Manual URL/title/image/price entry required.",
  affiliate_api_integration_required: "Affiliate/API integration required for reliable automation.",
};

type MarketplaceCoverageMeta = Omit<MarketplaceCoverageEntry, "merchant" | "parsingSupport">;

const MARKETPLACE_COVERAGE_META: Record<string, MarketplaceCoverageMeta> = {
  Amazon: {
    regionRelevance: "Very high (US/CA)",
    fetchMethod: "Amazon PA-API first, then HTML fallback",
    affiliateAvailability: "Amazon Associates (direct tag)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Some pages still require manual image/price due to anti-bot/dynamic rendering.",
    statusTag: "Partial",
    userRelevanceRank: 1,
  },
  Walmart: {
    regionRelevance: "Very high (US)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Region and session differences can hide price/image fields.",
    statusTag: "Partial",
    userRelevanceRank: 2,
  },
  Target: {
    regionRelevance: "Very high (US)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Hydration-heavy pages can reduce parser completeness.",
    statusTag: "Partial",
    userRelevanceRank: 3,
  },
  Etsy: {
    regionRelevance: "High (US/global)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Generally reliable; occasional listing-level metadata gaps.",
    statusTag: "Supported",
    userRelevanceRank: 4,
  },
  eBay: {
    regionRelevance: "High (US/global)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Markup variance and occasional block responses degrade parsing.",
    statusTag: "Partial",
    userRelevanceRank: 5,
  },
  "Best Buy": {
    regionRelevance: "High (US/CA)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "JS-heavy content and occasional anti-bot blocks.",
    statusTag: "Partial",
    userRelevanceRank: 6,
  },
  Costco: {
    regionRelevance: "High (US/CA)",
    fetchMethod: "Direct HTML fetch (frequently blocked)",
    affiliateAvailability: "Skimlinks pass-through (conversion uncertain)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Membership-first and anti-bot pages often block fetch attempts.",
    statusTag: "Manual fallback",
    userRelevanceRank: 7,
  },
  Wayfair: {
    regionRelevance: "Medium-high (US/CA)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Variant-level pricing may be missing from parsed output.",
    statusTag: "Partial",
    userRelevanceRank: 8,
  },
  AliExpress: {
    regionRelevance: "Medium (global)",
    fetchMethod: "Direct HTML fetch (frequently blocked)",
    affiliateAvailability: "No dedicated integration yet (API/program pending)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Requires explicit affiliate/API integration for reliable coverage.",
    statusTag: "Unsupported",
    userRelevanceRank: 9,
  },
  Temu: {
    regionRelevance: "Medium (US/global)",
    fetchMethod: "Direct HTML fetch (challenge pages)",
    affiliateAvailability: "Skimlinks pass-through (conversion uncertain)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Anti-bot/captcha behavior blocks automated preview extraction.",
    statusTag: "Manual fallback",
    userRelevanceRank: 10,
  },
  Shein: {
    regionRelevance: "Medium (US/global)",
    fetchMethod: "Direct HTML fetch (challenge pages)",
    affiliateAvailability: "Skimlinks pass-through (conversion uncertain)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Dynamic storefront + anti-bot gating limits parser reliability.",
    statusTag: "Manual fallback",
    userRelevanceRank: 11,
  },
  Zara: {
    regionRelevance: "Medium (US/global)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "JS-first product pages may omit complete metadata in HTML.",
    statusTag: "Partial",
    userRelevanceRank: 12,
  },
  "H&M": {
    regionRelevance: "Medium (US/global)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Hydration-driven rendering can hide price/image fields.",
    statusTag: "Partial",
    userRelevanceRank: 13,
  },
  Specialized: {
    regionRelevance: "Medium (US/global niche)",
    fetchMethod: "Direct HTML fetch + metadata parse",
    affiliateAvailability: "Skimlinks (best-effort)",
    commissionEstimate: "Unknown (program-dependent)",
    notesBlockers: "Mostly parseable; occasional CDN image misses.",
    statusTag: "Supported",
    userRelevanceRank: 14,
  },
};

function toParsingSupport(entry: MerchantSupportEntry): string {
  if (entry.parserResult === "success") {
    return `Full (${BEHAVIOR_LABEL[entry.behavior]})`;
  }
  if (entry.parserResult === "partial") {
    return `Partial (${BEHAVIOR_LABEL[entry.behavior]})`;
  }
  return `Failed (${BEHAVIOR_LABEL[entry.behavior]})`;
}

const DEFAULT_COVERAGE_META: MarketplaceCoverageMeta = {
  regionRelevance: "Unknown",
  fetchMethod: "Direct HTML fetch",
  affiliateAvailability: "Unknown",
  commissionEstimate: "Unknown",
  notesBlockers: "No notes available.",
  statusTag: "Unsupported",
  userRelevanceRank: Number.MAX_SAFE_INTEGER,
};

export const MARKETPLACE_COVERAGE_TABLE: MarketplaceCoverageEntry[] = MERCHANT_SUPPORT_MATRIX
  .map((entry) => {
    const meta = MARKETPLACE_COVERAGE_META[entry.merchant] ?? DEFAULT_COVERAGE_META;
    return {
      merchant: entry.merchant,
      parsingSupport: toParsingSupport(entry),
      ...meta,
    };
  })
  .sort((a, b) => a.userRelevanceRank - b.userRelevanceRank);

function normalizeHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

function classifyFetchFailureBehavior(
  baseBehavior: MerchantBehaviorClass,
  errorCode: string | null,
  rawReason: string | null
): MerchantBehaviorClass {
  const reason = rawReason?.toLowerCase() ?? "";
  if (errorCode === "FETCH_BLOCKED") {
    return "anti_bot_captcha_blocked";
  }
  if (errorCode === "FETCH_ERROR" && /\bhttp (403|429|503)\b/.test(reason)) {
    return "anti_bot_captcha_blocked";
  }
  if (errorCode === "TIMEOUT") {
    return "js_heavy_parseable";
  }
  return baseBehavior;
}

function getHumanReadableFailureReason(errorCode: string | null, rawReason: string | null): string {
  if (errorCode === "FETCH_BLOCKED") {
    return "Merchant blocked automated preview requests (anti-bot, captcha, or network policy).";
  }
  if (errorCode === "TIMEOUT") {
    return "Merchant page timed out before usable metadata could be extracted.";
  }
  if (errorCode === "NO_METADATA") {
    return "Page loaded but did not expose parseable metadata fields.";
  }
  if (errorCode === "FETCH_ERROR") {
    if (rawReason && /\bhttp (403|429|503)\b/i.test(rawReason)) {
      return "Merchant returned an HTTP block response during preview fetch.";
    }
    return "Preview fetch failed before metadata parsing completed.";
  }
  if (errorCode === "PREVIEW_UNAVAILABLE") {
    return "Preview system is temporarily unavailable.";
  }
  return rawReason ?? "Preview failed for an unknown reason.";
}

export function resolveMerchantSupportEntry(domainOrUrl: string): MerchantSupportEntry | null {
  const domain = normalizeHostname(
    domainOrUrl.includes("://") ? extractDomain(domainOrUrl) : domainOrUrl
  );

  return (
    MERCHANT_SUPPORT_MATRIX.find((entry) =>
      entry.domains.some((supportedDomain) => {
        const normalizedSupported = normalizeHostname(supportedDomain);
        return domain === normalizedSupported || domain.endsWith(`.${normalizedSupported}`);
      })
    ) ?? null
  );
}

export interface MerchantFailureLogInput {
  domain: string;
  errorCode: string | null;
  rawReason: string | null;
}

export interface MerchantFailureLog {
  merchant: string;
  behaviorClass: string;
  sampleUrl: string | null;
  fetchResult: string;
  parserResult: string;
  failureReason: string;
  fallbackRequirement: string;
}

export function buildMerchantFailureLog(input: MerchantFailureLogInput): MerchantFailureLog {
  const matched = resolveMerchantSupportEntry(input.domain);
  const baseBehavior = matched?.behavior ?? "static_html_parseable";
  const failureBehavior = classifyFetchFailureBehavior(baseBehavior, input.errorCode, input.rawReason);
  const summary = getHumanReadableFailureReason(input.errorCode, input.rawReason);
  const merchantReason = matched?.failureReason;
  const combinedReason = merchantReason ? `${summary} ${merchantReason}` : summary;

  return {
    merchant: matched?.merchant ?? "Unknown merchant",
    behaviorClass: BEHAVIOR_LABEL[failureBehavior],
    sampleUrl: matched?.sampleUrl ?? null,
    fetchResult: matched?.fetchResult ?? "unknown",
    parserResult: matched?.parserResult ?? "unknown",
    failureReason: combinedReason,
    fallbackRequirement: FALLBACK_LABEL[matched?.fallbackRequirement ?? "manual_full_entry"],
  };
}
