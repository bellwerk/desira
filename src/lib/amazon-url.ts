const AMAZON_RETAIL_DOMAINS = [
  "amazon.com",
  "amazon.ca",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
  "amazon.com.mx",
  "amazon.com.au",
] as const;

const AMAZON_RETAIL_DOMAIN_SET = new Set<string>(AMAZON_RETAIL_DOMAINS);

export type AmazonRetailDomain = (typeof AMAZON_RETAIL_DOMAINS)[number];

export type AmazonRetailProductRef = {
  asin: string;
  domain: AmazonRetailDomain;
  canonicalUrl: string;
};

export function normalizeAmazonRetailHostname(
  hostname: string
): AmazonRetailDomain | null {
  const normalized = hostname.toLowerCase();

  for (const domain of AMAZON_RETAIL_DOMAINS) {
    if (normalized === domain || normalized.endsWith(`.${domain}`)) {
      return domain;
    }
  }

  return null;
}

export function isAmazonRetailUrl(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    return normalizeAmazonRetailHostname(parsedUrl.hostname) !== null;
  } catch {
    return false;
  }
}

export function extractAmazonAsin(pathname: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/offer-listing\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

export function parseAmazonRetailProductUrl(
  urlString: string
): AmazonRetailProductRef | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return null;
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return null;
  }

  const domain = normalizeAmazonRetailHostname(parsedUrl.hostname);
  if (!domain || !AMAZON_RETAIL_DOMAIN_SET.has(domain)) {
    return null;
  }

  const asin = extractAmazonAsin(parsedUrl.pathname);
  if (!asin) {
    return null;
  }

  return {
    asin,
    domain,
    canonicalUrl: `https://www.${domain}/dp/${asin}`,
  };
}

export function canonicalizeAmazonRetailUrl(urlString: string): string | null {
  return parseAmazonRetailProductUrl(urlString)?.canonicalUrl ?? null;
}
