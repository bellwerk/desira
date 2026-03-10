import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("public page footer exposes legal and disclosure links", async ({ page, request }) => {
  const seed = await createSeed(request, { visibility: "public" });

  await page.goto(`/u/${seed.share_token}`);

  await expect(page.getByRole("link", { name: "Affiliate disclosure" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
});

test("legal pages are reachable from public footer links", async ({ page }) => {
  await page.goto("/affiliate-disclosure");
  await expect(page.getByRole("heading", { name: "Affiliate Disclosure" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "About Desira" })).toBeVisible();

  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
});
