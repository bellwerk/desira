import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "./helpers/seed";
import { getRateLimitClientKey } from "../src/lib/rate-limit";

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

test("link preview API rejects unauthenticated requests", async ({ request }) => {
  const response = await request.post("/api/link-preview", {
    data: {
      url: "https://example.com/gift",
    },
  });

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: {
      code: "PREVIEW_UNAVAILABLE",
    },
  });
});

test("authenticated limiter key is scoped by trusted subject", async ({ page, request }) => {
  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  const spoofedHeaders = new Headers({
    "cf-connecting-ip": "8.8.8.8",
    "user-agent": "Playwright Test Browser",
    "accept-language": "en-US",
  });

  const userAKey = getRateLimitClientKey(spoofedHeaders, "user-a-id");
  const userBKey = getRateLimitClientKey(spoofedHeaders, "user-b-id");

  expect(userAKey).toBe("user:user-a-id");
  expect(userBKey).toBe("user:user-b-id");
  expect(userAKey).not.toBe(userBKey);
});
