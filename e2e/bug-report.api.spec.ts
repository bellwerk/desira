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

test("bug-report endpoint rejects unauthenticated submissions", async ({ request }) => {
  const response = await request.post("/api/bug-reports", {
    data: {
      category: "bug",
      summary: "Submit fails in guest mode",
      details: "I cannot save a bug report when I am not authenticated in the app.",
      page: "/app/feedback",
    },
  });

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: { code: "UNAUTHORIZED" },
  });
});

test("authenticated users can submit bug reports", async ({ page, request }) => {
  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/settings");

  const response = await page.request.post("/api/bug-reports", {
    data: {
      category: "ui",
      summary: "Settings quick action text wraps incorrectly",
      details:
        "On smaller screens, the settings quick-action row wraps and pushes the chevron icon out of alignment.",
      page: "/app/settings",
    },
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
  });
});
