import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "./helpers/seed";

async function loginAsSeededOwner(
  page: Page,
  email: string,
  password: string,
  nextPath: string
): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log In" }).click();

    try {
      await expect(page).toHaveURL(new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      return;
    } catch (error) {
      const invalidCredentials = page
        .getByRole("alert")
        .filter({ hasText: "Invalid login credentials" });
      if (attempt === 4 || !(await invalidCredentials.isVisible().catch(() => false))) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }
}

test("preview fetch failures still allow full manual entry (url/title/image/price)", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  await page.getByRole("link", { name: "Desira Demo List" }).first().click();
  await expect(page).toHaveURL(/\/app\/lists\/.+/);

  await page.getByRole("button", { name: "Add New Wish" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Add Wish" })).toBeVisible();

  await dialog.getByPlaceholder("https://").fill("https://httpstat.us/403");
  await dialog.getByRole("button", { name: "Next", exact: true }).click();

  await expect(dialog.getByText("manual entry: URL, title, image, and price.")).toBeVisible();

  const manualTitle = `Manual fallback item ${Date.now()}`;
  await dialog.getByLabel("Title").fill(manualTitle);
  await dialog.getByLabel("Price").fill("49.99");

  await dialog.getByTitle("Paste image URL").click();
  await dialog.getByPlaceholder("https://example.com/image.jpg").fill("https://picsum.photos/400/400");

  await dialog.getByRole("button", { name: "Save Wish" }).click();
  await expect(page.getByText(manualTitle)).toBeVisible();
});
