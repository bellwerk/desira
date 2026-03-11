import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "./helpers/seed";

async function completeEmailLogin(
  page: Page,
  email: string,
  password: string,
  expectedUrlPattern: RegExp
): Promise<void> {
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log In" }).click();

    try {
      await expect(page).toHaveURL(expectedUrlPattern);
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

test("guest can open seeded shared list", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto(`/u/${seed.share_token}`);

  await expect(page.getByText("MAAP Jersey (Black)")).toBeVisible();
  await expect(page.getByText("Gift card: Local coffee roaster")).toBeVisible();
});

test("ideas page honors the category query string", async ({ page, request }) => {
  await createSeed(request, { visibility: "public" });

  await page.goto("/ideas?category=home");

  await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gift card: Local coffee roaster" }).first()).toBeVisible();
  await expect(page.getByText("MAAP Jersey (Black)")).not.toBeVisible();
});

test("choosing an ideas category updates the URL and sign-in continuation", async ({
  page,
  request,
}) => {
  await createSeed(request, { visibility: "public" });

  await page.goto("/ideas");
  await page.getByRole("button", { name: "Home" }).click();

  await expect(page).toHaveURL(/\/ideas\?category=home/);

  const signInLink = page.getByRole("link", { name: "Sign in" });
  await expect(signInLink).toHaveAttribute(
    "href",
    "/login?next=%2Fapp%2Fideas%3Fcategory%3Dhome"
  );
});

test("public ideas sign-in returns existing users to the app ideas picker", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request, { visibility: "public" });

  await page.goto("/ideas?category=home");
  await page.getByRole("button", { name: "Add idea Gift card: Local coffee roaster" }).first().click();
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/login\?/);
  const loginUrl = new URL(page.url());
  const nextParam = loginUrl.searchParams.get("next");
  expect(nextParam).toContain("/app/ideas?category=home");
  expect(nextParam).toContain("suggestion_id=");
  expect(nextParam).toContain("suggestion=Gift+card%3A+Local+coffee+roaster");

  await completeEmailLogin(
    page,
    seed.demo_owner.email,
    seed.demo_owner.password,
    /\/app\/ideas\?category=home/
  );

  await expect(page.getByRole("heading", { name: "Add this idea" })).toBeVisible();
  await expect(page.getByText("Desira Demo List")).toBeVisible();
});

test("guest can reserve then cancel from same browser token", async ({ page, request }) => {
  const seed = await createSeed(request);

  await page.goto(`/u/${seed.share_token}`);

  const reserveButton = page.getByRole("button", { name: "Buy gift" }).first();
  await expect(reserveButton).toBeEnabled();
  await reserveButton.click();

  await expect(page.getByRole("button", { name: /Buy on/i })).toBeVisible();
  const reserveOnlyButton = page.getByRole("button", { name: "Reserve only (24h)" });
  await expect(reserveOnlyButton).toBeVisible();
  await expect(page.getByText("We'll hold it for 24h.").first()).toBeVisible();

  await reserveOnlyButton.click();
  await expect(page).toHaveURL(new RegExp(`/u/${seed.share_token}$`));
  await expect(
    page.getByText("Did you buy this gift? We'll hold it for 24h.")
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo hold" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Hold removed. This gift is available again." })).toBeVisible();
  await expect(page.getByText("Did you buy this gift? We'll hold it for 24h.")).not.toBeVisible();
  await page.reload();

  const buyAgainButton = page.getByRole("button", { name: "Buy gift" }).first();
  await expect(buyAgainButton).toBeVisible();
  await buyAgainButton.click();
  await expect(page).toHaveURL(/\/u\/.+\/reserve\?item=/);
  await expect(page.getByRole("button", { name: "Reserve only (24h)" })).toBeVisible();
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
  expect(url.searchParams.get("next")).toBe("/app");
});
