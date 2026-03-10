import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("public list HTML includes server-rendered merchant links and OG metadata", async ({
  request,
}) => {
  const seed = await createSeed(request, { visibility: "public" });
  const response = await request.get(`/u/${seed.share_token}`);

  expect(response.status()).toBe(200);

  const html = await response.text();
  expect(html).toContain("/api/go/");
  expect(html).toContain('property="og:title"');
  expect(html).toContain('property="og:description"');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('"@type":"CollectionPage"');
  expect(html).toContain('"@type":"ItemList"');
  expect(html).toContain("Desira Demo List");
});

test("public profile HTML includes profile structured data", async ({ request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const handle = seed.demo_owner.handle;
  if (!handle) {
    throw new Error("Seed response is missing demo_owner.handle");
  }

  const response = await request.get(`/@/${handle}`);
  expect(response.status()).toBe(200);

  const html = await response.text();
  expect(html).toContain('"@type":"ProfilePage"');
  expect(html).toContain(`"@${handle}"`);
});
