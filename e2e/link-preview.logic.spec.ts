import { expect, test } from "@playwright/test";
import { parseHtml } from "../src/app/api/link-preview/route";
import {
  buildMerchantFailureLog,
  MARKETPLACE_COVERAGE_TABLE,
  MERCHANT_SEED_LIST,
  resolveMerchantSupportEntry,
} from "../src/lib/link-preview/merchant-support";
import { normalizeUrl, validateUrlForSsrf } from "../src/lib/url";

test("normalizeUrl strips tracking params and sorts remaining params", () => {
  const normalized = normalizeUrl(
    "https://Shop.Example.com/products/road-bike/?utm_source=newsletter&b=2&a=1&fbclid=test"
  );

  expect(normalized).toBe("https://shop.example.com/products/road-bike?a=1&b=2");
});

test("validateUrlForSsrf blocks private targets and non-http protocols", () => {
  expect(validateUrlForSsrf("http://127.0.0.1:3000/private").ok).toBeFalsy();
  expect(validateUrlForSsrf("https://localhost/admin").ok).toBeFalsy();
  expect(validateUrlForSsrf("file:///etc/passwd").ok).toBeFalsy();
  expect(validateUrlForSsrf("https://example.com/gift").ok).toBeTruthy();
});

test("parseHtml extracts product data from JSON-LD @graph", () => {
  const html = `
    <html>
      <head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Product",
                "name": "Graph Product Name",
                "description": "Graph Product Description",
                "image": ["https://cdn.example.com/p/graph.jpg"],
                "offers": [
                  {
                    "@type": "Offer",
                    "price": "149.99",
                    "priceCurrency": "USD"
                  }
                ]
              }
            ]
          }
        </script>
      </head>
      <body></body>
    </html>
  `;

  const data = parseHtml(html, "https://shop.example.com/p/graph");
  expect(data.title).toBe("Graph Product Name");
  expect(data.description).toBe("Graph Product Description");
  expect(data.image).toBe("https://cdn.example.com/p/graph.jpg");
  expect(data.price).toEqual({ amount: 149.99, currency: "USD" });
});

test("parseHtml handles invalid JSON-LD and falls back to OG metadata", () => {
  const html = `
    <html>
      <head>
        <script type="application/ld+json">
          { this is invalid json }
        </script>
        <meta property="og:title" content="Fallback Product">
        <meta property="og:description" content="Fallback description">
        <meta property="og:image" content="https://cdn.example.com/p/fallback.jpg">
        <meta property="product:price:amount" content="89.50">
        <meta property="product:price:currency" content="CAD">
      </head>
      <body></body>
    </html>
  `;

  const data = parseHtml(html, "https://shop.example.com/p/fallback");
  expect(data.title).toBe("Fallback Product");
  expect(data.description).toBe("Fallback description");
  expect(data.image).toBe("https://cdn.example.com/p/fallback.jpg");
  expect(data.price).toEqual({ amount: 89.5, currency: "CAD" });
});

test("resolveMerchantSupportEntry matches known merchant domains and subdomains", () => {
  const amazon = resolveMerchantSupportEntry("www.amazon.com");
  const shein = resolveMerchantSupportEntry("us.shein.com");
  const unknown = resolveMerchantSupportEntry("unknown-shop.example");

  expect(amazon?.merchant).toBe("Amazon");
  expect(shein?.merchant).toBe("Shein");
  expect(unknown).toBeNull();
});

test("buildMerchantFailureLog returns readable blocked guidance", () => {
  const failure = buildMerchantFailureLog({
    domain: "temu.com",
    errorCode: "FETCH_BLOCKED",
    rawReason: "HTTP 403",
  });

  expect(failure.merchant).toBe("Temu");
  expect(failure.behaviorClass).toBe("anti-bot/captcha blocked");
  expect(failure.failureReason).toContain("blocked automated preview requests");
  expect(failure.fallbackRequirement).toBe("Manual URL/title/image/price entry required.");
});

test("marketplace coverage table includes all seed merchants and is relevance-sorted", () => {
  const merchantsInCoverage = MARKETPLACE_COVERAGE_TABLE.map((entry) => entry.merchant);

  expect(new Set(merchantsInCoverage).size).toBe(merchantsInCoverage.length);
  expect(merchantsInCoverage).toEqual(expect.arrayContaining([...MERCHANT_SEED_LIST]));

  for (let i = 1; i < MARKETPLACE_COVERAGE_TABLE.length; i += 1) {
    expect(MARKETPLACE_COVERAGE_TABLE[i - 1].userRelevanceRank).toBeLessThanOrEqual(
      MARKETPLACE_COVERAGE_TABLE[i].userRelevanceRank
    );
  }
});
