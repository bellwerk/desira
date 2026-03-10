import { expect, test } from "@playwright/test";

test("cookie consent banner can be accepted and remains dismissed", async ({ page }) => {
  await page.goto("/explore");

  await expect(page.getByText("We use cookies and similar technologies")).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("We use cookies and similar technologies")).toBeHidden();

  await page.reload();
  await expect(page.getByText("We use cookies and similar technologies")).toBeHidden();
});
