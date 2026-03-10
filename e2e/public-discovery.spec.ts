import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("explore page shows seeded public lists", async ({ page, request }) => {
  await createSeed(request, { visibility: "public" });

  await page.goto("/explore");

  await expect(page.getByRole("heading", { name: "Explore Public Lists" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View list" }).first()).toBeVisible();
  await expect(page.getByText("Desira Demo List").first()).toBeVisible();
});

test("public profile page at /@/[username] is reachable and lists public lists", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request, { visibility: "public" });
  const handle = seed.demo_owner.handle;

  if (!handle) {
    throw new Error("Seed response is missing demo_owner.handle");
  }

  await page.goto(`/@/${handle}`);

  await expect(page.getByText(`@${handle}`).first()).toBeVisible();
  await expect(page.getByText("Desira Demo List").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "View list" }).first()).toBeVisible();
});
