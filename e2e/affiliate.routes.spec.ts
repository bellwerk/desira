import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

function extractFirstItemIdFromHtml(html: string): string {
  const match = html.match(/\/api\/go\/([0-9a-f-]{36})\?token=/i);
  if (!match?.[1]) {
    throw new Error("Could not extract item id from public list HTML");
  }
  return match[1];
}

const AMAZON_URL = "https://www.amazon.co.uk/gp/product/B0CHWRXH8B?ref_=abc&utm_source=test";
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG?.trim();
const CANONICAL_AMAZON_URL = AMAZON_ASSOCIATES_TAG
  ? `https://www.amazon.co.uk/dp/B0CHWRXH8B?tag=${encodeURIComponent(AMAZON_ASSOCIATES_TAG)}`
  : null;

test("go redirect resolves Amazon URLs to canonical tagged links", async ({ request }) => {
  test.skip(!CANONICAL_AMAZON_URL, "Requires AMAZON_ASSOCIATES_TAG in the test server environment.");
  const seed = await createSeed(request, { visibility: "public", firstItemUrl: AMAZON_URL });
  const publicListResponse = await request.get(`/u/${seed.share_token}`);
  const itemId = extractFirstItemIdFromHtml(await publicListResponse.text());

  const response = await request.get(`/api/go/${itemId}?token=${seed.share_token}&resolve=1`);
  const json = await response.json();

  expect(response.status(), JSON.stringify(json)).toBe(200);
  expect(json).toMatchObject({
    ok: true,
    redirect_url: CANONICAL_AMAZON_URL,
  });
});

test("affiliate click endpoint returns canonical tagged Amazon URLs", async ({ request }) => {
  test.skip(!CANONICAL_AMAZON_URL, "Requires AMAZON_ASSOCIATES_TAG in the test server environment.");
  const seed = await createSeed(request, { visibility: "public", firstItemUrl: AMAZON_URL });
  const publicListResponse = await request.get(`/u/${seed.share_token}`);
  const itemId = extractFirstItemIdFromHtml(await publicListResponse.text());

  const deviceToken = randomUUID();
  const reserveResponse = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken,
      share_token: seed.share_token,
    },
  });
  const reserveJson = await reserveResponse.json();
  expect(reserveResponse.status(), JSON.stringify(reserveJson)).toBe(200);

  const affiliateClickResponse = await request.post(`/api/gifts/${itemId}/affiliate-click`, {
    data: {
      deviceToken,
      cancelToken: reserveJson.cancel_token,
      share_token: seed.share_token,
    },
  });
  const affiliateClickJson = await affiliateClickResponse.json();

  expect(affiliateClickResponse.status(), JSON.stringify(affiliateClickJson)).toBe(200);
  expect(affiliateClickJson).toMatchObject({
    ok: true,
    affiliate_url: CANONICAL_AMAZON_URL,
  });
});
