import { createHash, createHmac } from "crypto";
import { parseAmazonRetailProductUrl } from "@/lib/amazon-url";

const AMAZON_PAAPI_DOMAINS = new Set(["amazon.com", "amazon.ca"]);

const PAAPI_SERVICE = "ProductAdvertisingAPI";
const PAAPI_TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
const PAAPI_PATH = "/paapi5/getitems";
const PAAPI_TIMEOUT_MS = 3500;
const PAAPI_CONTENT_ENCODING = "amz-1.0";

const PAAPI_RESOURCES = [
  "ItemInfo.Title",
  "ItemInfo.Features",
  "Images.Primary.Small",
  "Images.Primary.Medium",
  "Images.Primary.Large",
  "Offers.Listings.Price",
  "Offers.Summaries.LowestPrice",
  "DetailPageURL",
] as const;

export interface AmazonProductRef {
  asin: string;
  domain: "amazon.com" | "amazon.ca";
  host: string;
  marketplace: string;
  region: "us-east-1";
  canonicalUrl: string;
}

export interface AmazonPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  price: { amount: number; currency: string } | null;
}

type AmazonPreviewResult =
  | { ok: true; data: AmazonPreviewData }
  | { ok: false; code: "NOT_CONFIGURED" | "REQUEST_FAILED" | "INVALID_RESPONSE"; error: string };

type PaapiCredentials = {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
};

function stripAmazonSubdomain(hostname: string): string {
  if (hostname === "amazon.com" || hostname === "amazon.ca") {
    return hostname;
  }
  if (hostname.endsWith(".amazon.com")) {
    return "amazon.com";
  }
  if (hostname.endsWith(".amazon.ca")) {
    return "amazon.ca";
  }
  return hostname;
}

export function parseAmazonProductUrl(urlString: string): AmazonProductRef | null {
  const retailProduct = parseAmazonRetailProductUrl(urlString);
  if (!retailProduct) {
    return null;
  }

  const normalizedDomain = stripAmazonSubdomain(retailProduct.domain.toLowerCase());
  if (!AMAZON_PAAPI_DOMAINS.has(normalizedDomain)) {
    return null;
  }

  const domain = normalizedDomain as "amazon.com" | "amazon.ca";
  return {
    asin: retailProduct.asin,
    domain,
    host: `webservices.${domain}`,
    marketplace: `www.${domain}`,
    region: "us-east-1",
    canonicalUrl: retailProduct.canonicalUrl,
  };
}

function getPaapiCredentials(): PaapiCredentials | null {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  return { accessKey, secretKey, partnerTag };
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function getTimestamps(now = new Date()): { amzDate: string; dateStamp: string } {
  const iso = now.toISOString();
  const amzDate = iso.replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate,
    dateStamp: amzDate.slice(0, 8),
  };
}

function buildAuthorizationHeader(params: {
  payloadHash: string;
  amzDate: string;
  dateStamp: string;
  host: string;
  region: string;
  accessKey: string;
  secretKey: string;
}): string {
  const canonicalHeaders =
    `content-encoding:${PAAPI_CONTENT_ENCODING}\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${params.host}\n` +
    `x-amz-date:${params.amzDate}\n` +
    `x-amz-target:${PAAPI_TARGET}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    PAAPI_PATH,
    "",
    canonicalHeaders,
    signedHeaders,
    params.payloadHash,
  ].join("\n");

  const credentialScope = `${params.dateStamp}/${params.region}/${PAAPI_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    params.amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${params.secretKey}`, params.dateStamp);
  const kRegion = hmacSha256(kDate, params.region);
  const kService = hmacSha256(kRegion, PAAPI_SERVICE);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return (
    `AWS4-HMAC-SHA256 Credential=${params.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`
  );
}

function parsePrice(item: unknown): { amount: number; currency: string } | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const itemObj = item as Record<string, unknown>;
  const offers = itemObj.Offers;
  if (!offers || typeof offers !== "object") {
    return null;
  }

  const offersObj = offers as Record<string, unknown>;

  const listings = offersObj.Listings;
  if (Array.isArray(listings) && listings.length > 0) {
    const firstListing = listings[0];
    if (firstListing && typeof firstListing === "object") {
      const price = (firstListing as Record<string, unknown>).Price;
      if (price && typeof price === "object") {
        const amount = Number((price as Record<string, unknown>).Amount);
        const currency = (price as Record<string, unknown>).Currency;
        if (Number.isFinite(amount) && typeof currency === "string" && currency.length > 0) {
          return { amount, currency };
        }
      }
    }
  }

  const summaries = offersObj.Summaries;
  if (Array.isArray(summaries) && summaries.length > 0) {
    const firstSummary = summaries[0];
    if (firstSummary && typeof firstSummary === "object") {
      const lowestPrice = (firstSummary as Record<string, unknown>).LowestPrice;
      if (lowestPrice && typeof lowestPrice === "object") {
        const amount = Number((lowestPrice as Record<string, unknown>).Amount);
        const currency = (lowestPrice as Record<string, unknown>).Currency;
        if (Number.isFinite(amount) && typeof currency === "string" && currency.length > 0) {
          return { amount, currency };
        }
      }
    }
  }

  return null;
}

function mapPaapiItemToPreview(item: unknown): AmazonPreviewData {
  if (!item || typeof item !== "object") {
    return {
      title: null,
      description: null,
      image: null,
      images: [],
      price: null,
    };
  }

  const itemObj = item as Record<string, unknown>;
  const itemInfo = itemObj.ItemInfo as Record<string, unknown> | undefined;
  const titleObj = itemInfo?.Title as Record<string, unknown> | undefined;
  const title = typeof titleObj?.DisplayValue === "string" ? titleObj.DisplayValue : null;

  let description: string | null = null;
  const features = itemInfo?.Features as Record<string, unknown> | undefined;
  if (features?.DisplayValues && Array.isArray(features.DisplayValues) && features.DisplayValues.length > 0) {
    const firstFeature = features.DisplayValues[0];
    if (typeof firstFeature === "string") {
      description = firstFeature;
    }
  }

  const images = itemObj.Images as Record<string, unknown> | undefined;
  const primary = images?.Primary as Record<string, unknown> | undefined;
  const large = primary?.Large as Record<string, unknown> | undefined;
  const medium = primary?.Medium as Record<string, unknown> | undefined;
  const small = primary?.Small as Record<string, unknown> | undefined;

  const image =
    (typeof large?.URL === "string" ? large.URL : null) ??
    (typeof medium?.URL === "string" ? medium.URL : null) ??
    (typeof small?.URL === "string" ? small.URL : null);

  const imageList = image ? [image] : [];

  return {
    title,
    description,
    image,
    images: imageList,
    price: parsePrice(itemObj),
  };
}

export async function fetchAmazonPreview(productRef: AmazonProductRef): Promise<AmazonPreviewResult> {
  const creds = getPaapiCredentials();
  if (!creds) {
    return {
      ok: false,
      code: "NOT_CONFIGURED",
      error: "Amazon PA-API credentials are not configured",
    };
  }

  const requestBody = JSON.stringify({
    ItemIds: [productRef.asin],
    ItemIdType: "ASIN",
    Marketplace: productRef.marketplace,
    PartnerTag: creds.partnerTag,
    PartnerType: "Associates",
    Resources: [...PAAPI_RESOURCES],
  });

  const payloadHash = sha256Hex(requestBody);
  const { amzDate, dateStamp } = getTimestamps();
  const authorization = buildAuthorizationHeader({
    payloadHash,
    amzDate,
    dateStamp,
    host: productRef.host,
    region: productRef.region,
    accessKey: creds.accessKey,
    secretKey: creds.secretKey,
  });

  const endpoint = `https://${productRef.host}${PAAPI_PATH}`;

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PAAPI_TIMEOUT_MS);
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-encoding": PAAPI_CONTENT_ENCODING,
        "content-type": "application/json; charset=utf-8",
        "x-amz-date": amzDate,
        "x-amz-target": PAAPI_TARGET,
        authorization,
      },
      body: requestBody,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        code: "REQUEST_FAILED",
        error: `Amazon PA-API request timed out after ${PAAPI_TIMEOUT_MS}ms`,
      };
    }
    return {
      ok: false,
      code: "REQUEST_FAILED",
      error: error instanceof Error ? error.message : "Failed to call Amazon PA-API",
    };
  } finally {
    clearTimeout(timeoutId);
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      error: "Amazon PA-API returned invalid JSON",
    };
  }

  const dataObj = parsed as Record<string, unknown>;
  const rootErrors = dataObj.Errors;
  if (Array.isArray(rootErrors) && rootErrors.length > 0) {
    return {
      ok: false,
      code: "REQUEST_FAILED",
      error: "Amazon PA-API returned an error for this product",
    };
  }

  const itemsResult = dataObj.ItemsResult as Record<string, unknown> | undefined;
  const items = itemsResult?.Items;
  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      error: "Amazon PA-API returned no items",
    };
  }

  return {
    ok: true,
    data: mapPaapiItemToPreview(items[0]),
  };
}
