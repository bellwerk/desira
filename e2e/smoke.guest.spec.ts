import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

test("guest can open seeded shared list", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto(`/u/${seed.share_token}`);

  await expect(page.getByText("MAAP Jersey (Black)")).toBeVisible();
  await expect(page.getByText("Gift card: Local coffee roaster")).toBeVisible();
});

test("guest can reserve then cancel from same browser token", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto(`/u/${seed.share_token}`);

  const reserveButton = page.getByRole("button", { name: "Buy this gift" }).first();
  await expect(reserveButton).toBeEnabled();
  await reserveButton.click();

  const cancelButton = page.getByRole("button", { name: "Cancel" }).first();
  await expect(cancelButton).toBeVisible();

  await expect(page.getByRole("button", { name: "Contribute" }).first()).toBeDisabled();

  await cancelButton.click();
  await expect(page).toHaveURL(/\/u\/.+\/cancel\?item=/);

  await page.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(page).toHaveURL(new RegExp(`/u/${seed.share_token}$`));

  await expect(page.getByRole("button", { name: "Buy this gift" }).first()).toBeVisible();
});

test("guest can contribute and reach pay summary", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto(`/u/${seed.share_token}`);

  const contributeLink = page.getByRole("link", { name: "Contribute" }).first();
  await contributeLink.click();

  await expect(page).toHaveURL(/\/u\/.+\/contribute\?item=/);
  await page.getByRole("button", { name: "$50" }).click();
  await page.getByRole("button", { name: "Continue to Pay" }).click();

  await expect(page).toHaveURL(/\/u\/.+\/pay\?item=/);
  await expect(page.getByText("Contribution")).toBeVisible();
  await expect(page.getByText("Desira service fee")).toBeVisible();
  await expect(page.getByText("Total charged")).toBeVisible();
});

test("invite route redirects guests to login", async ({ page }) => {
  const token = "someToken";
  await page.goto(`/app/invite/${token}`);

  await expect(page).toHaveURL(/\/login\?/);

  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toBe(`/app/invite/${token}`);
});
