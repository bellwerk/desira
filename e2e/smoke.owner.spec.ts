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
      const invalidCredentials = page.getByRole("alert").filter({ hasText: "Invalid login credentials" });
      if (attempt === 4 || !(await invalidCredentials.isVisible().catch(() => false))) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }
}

test("owner can login, open list, and add item manually", async ({ page, request }) => {
  const seed = await createSeed(request);

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
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

test("owner creating a list from a suggestion lands directly on wish details", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request);

  await loginAsSeededOwner(
    page,
    seed.demo_owner.email,
    seed.demo_owner.password,
    "/app/lists/new?suggestion=Kindle%20Paperwhite"
  );
  await expect(page).toHaveURL(/\/app\/lists\/new\?suggestion=Kindle%20Paperwhite/);

  const listName = `E2E Suggested List ${Date.now()}`;
  await page.getByLabel("List name").fill(listName);
  await page.getByRole("button", { name: "Create list" }).click();

  await expect(page).toHaveURL(/\/app\/lists\/.+\?suggestion=Kindle%20Paperwhite/);
  await expect(page.getByRole("heading", { name: "Wish Details" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Kindle Paperwhite");
  await expect(page.getByRole("heading", { name: "Add Wish" })).not.toBeVisible();
});

test("signed-in users keep the selected ideas category when visiting public ideas links", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request, { visibility: "public" });

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
  await page.goto("/ideas?category=home");

  await expect(page).toHaveURL(/\/app\/ideas\?category=home/);
  await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Gift card: Local coffee roaster" }).first()
  ).toBeVisible();
});
