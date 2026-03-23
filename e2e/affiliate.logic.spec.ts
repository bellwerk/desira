import { expect, test } from "@playwright/test";
import {
  canonicalizeProductUrlForStorage,
  generateAffiliateUrl,
  getAffiliateProvider,
  resolveProductUrlForStorage,
} from "../src/lib/affiliate";
import { canonicalizeAmazonRetailUrl } from "../src/lib/amazon-url";

const ORIGINAL_ENV = {
  AMAZON_ASSOCIATES_TAG: process.env.AMAZON_ASSOCIATES_TAG,
  AMAZON_PAAPI_PARTNER_TAG: process.env.AMAZON_PAAPI_PARTNER_TAG,
  SKIMLINKS_PUBLISHER_ID: process.env.SKIMLINKS_PUBLISHER_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

function restoreEnvVar(key: keyof typeof ORIGINAL_ENV): void {
  const originalValue = ORIGINAL_ENV[key];
  if (typeof originalValue === "undefined") {
    delete process.env[key];
    return;
  }
  process.env[key] = originalValue;
}

test.afterEach(() => {
  restoreEnvVar("AMAZON_ASSOCIATES_TAG");
  restoreEnvVar("AMAZON_PAAPI_PARTNER_TAG");
  restoreEnvVar("SKIMLINKS_PUBLISHER_ID");
  restoreEnvVar("NEXT_PUBLIC_APP_URL");
});

test("canonicalizeAmazonRetailUrl rewrites supported Amazon product links to /dp/ASIN", () => {
  expect(
    canonicalizeAmazonRetailUrl("https://www.amazon.co.uk/gp/product/B0CHWRXH8B?ref_=abc&utm_source=test")
  ).toBe("https://www.amazon.co.uk/dp/B0CHWRXH8B");
});

test("generateAffiliateUrl appends Amazon tag to canonical retail URLs", () => {
  process.env.AMAZON_ASSOCIATES_TAG = "desira-test-20";
  process.env.SKIMLINKS_PUBLISHER_ID = "";

  const affiliateUrl = generateAffiliateUrl(
    "https://www.amazon.co.uk/gp/product/B0CHWRXH8B?ref_=abc&utm_source=test"
  );

  expect(getAffiliateProvider("https://www.amazon.co.uk/gp/product/B0CHWRXH8B?ref_=abc")).toBe(
    "amazon_associates"
  );
  expect(affiliateUrl).toBe("https://www.amazon.co.uk/dp/B0CHWRXH8B?tag=desira-test-20");
});

test("generateAffiliateUrl passes through unsupported Amazon/no-tag URLs", () => {
  process.env.AMAZON_ASSOCIATES_TAG = "";
  process.env.AMAZON_PAAPI_PARTNER_TAG = "";
  process.env.SKIMLINKS_PUBLISHER_ID = "";

  const originalUrl = "https://www.amazon.in/dp/B0CHWRXH8B?ref_=abc";
  expect(getAffiliateProvider(originalUrl)).toBe("none");
  expect(generateAffiliateUrl(originalUrl)).toBe(originalUrl);
});

test("supported Amazon URLs do not fall back to Skimlinks when the direct tag is missing", () => {
  process.env.AMAZON_ASSOCIATES_TAG = "";
  process.env.AMAZON_PAAPI_PARTNER_TAG = "";
  process.env.SKIMLINKS_PUBLISHER_ID = "12345X";
  process.env.NEXT_PUBLIC_APP_URL = "https://desira.test";

  const originalUrl = "https://www.amazon.com/gp/product/B0CHWRXH8B?ref_=abc";
  expect(getAffiliateProvider(originalUrl)).toBe("none");
  expect(generateAffiliateUrl(originalUrl)).toBe("https://www.amazon.com/dp/B0CHWRXH8B");
});

test("generateAffiliateUrl wraps non-Amazon URLs with Skimlinks when configured", () => {
  process.env.AMAZON_ASSOCIATES_TAG = "";
  process.env.AMAZON_PAAPI_PARTNER_TAG = "";
  process.env.SKIMLINKS_PUBLISHER_ID = "12345X";
  process.env.NEXT_PUBLIC_APP_URL = "https://desira.test";

  const affiliateUrl = generateAffiliateUrl("https://shop.example.com/products/road-bike", "item-123");
  const parsed = new URL(affiliateUrl);

  expect(getAffiliateProvider("https://shop.example.com/products/road-bike")).toBe("skimlinks");
  expect(parsed.origin).toBe("https://go.redirectingat.com");
  expect(parsed.searchParams.get("id")).toBe("12345X");
  expect(parsed.searchParams.get("url")).toBe("https://shop.example.com/products/road-bike");
  expect(parsed.searchParams.get("sref")).toBe("https://desira.test");
  expect(parsed.searchParams.get("xcust")).toBe("item-123");
});

test("resolveProductUrlForStorage prefers normalized URLs and canonicalizes direct Amazon links", () => {
  expect(
    resolveProductUrlForStorage(
      "https://amzn.to/example-short-link",
      "https://www.amazon.com/gp/product/B0CHWRXH8B?psc=1"
    )
  ).toBe("https://www.amazon.com/dp/B0CHWRXH8B");

  expect(
    resolveProductUrlForStorage("https://www.amazon.com/gp/product/B0CHWRXH8B?ref_=abc", undefined)
  ).toBe("https://www.amazon.com/dp/B0CHWRXH8B");

  expect(resolveProductUrlForStorage("https://shop.example.com/gift", "")).toBe(
    "https://shop.example.com/gift"
  );
  expect(canonicalizeProductUrlForStorage("https://shop.example.com/gift")).toBe(
    "https://shop.example.com/gift"
  );
});
