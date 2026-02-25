import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("owner can login, open list, and add item manually", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto("/login?next=%2Fapp%2Flists");
  await page.getByLabel("Email address").fill(seed.demo_owner.email);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Password").fill(seed.demo_owner.password);
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page).toHaveURL(/\/app\/lists/);
  await expect(page.getByRole("link", { name: "Desira Demo List" })).toBeVisible();

  await page.getByRole("link", { name: "Desira Demo List" }).click();
  await expect(page).toHaveURL(/\/app\/lists\/.+/);

  await page.getByRole("button", { name: "Add New Wish" }).click();
  await expect(page.getByRole("heading", { name: "Add Wish" })).toBeVisible();

  await page.getByRole("button", { name: "Add Manually" }).click();
  await expect(page.getByRole("heading", { name: "Wish Details" })).toBeVisible();

  const newTitle = `E2E Manual Item ${Date.now()}`;
  await page.getByLabel("Title").fill(newTitle);
  await page.getByRole("button", { name: "Save Wish" }).click();

  await expect(page.getByText(newTitle)).toBeVisible();
});
