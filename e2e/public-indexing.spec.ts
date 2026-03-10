import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("robots.txt exposes sitemap and blocks private app surfaces", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);

  const text = await response.text();
  expect(text).toContain("Sitemap:");
  expect(text).toContain("Disallow: /app");
  expect(text).toContain("Disallow: /api");
});

test("sitemap includes public list and profile URLs", async ({ request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const handle = seed.demo_owner.handle;
  if (!handle) {
    throw new Error("Seed response is missing demo_owner.handle");
  }

  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain("/explore");
  expect(xml).toContain(`/u/${seed.share_token}`);
  expect(xml).toContain(`/@/${handle}`);
});
