import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "./helpers/seed";

const VIEWPORTS = [
  { width: 320, height: 720, label: "320" },
  { width: 375, height: 812, label: "375" },
  { width: 768, height: 1024, label: "768" },
  { width: 1024, height: 768, label: "1024" },
  { width: 1366, height: 768, label: "1366" },
] as const;

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
      await expect(page).toHaveURL(
        new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      );
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

async function expectHorizontalOverflowWithin(page: Page, maxOverflowPx: number): Promise<void> {
  const overflowPx = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - window.innerWidth);
  });

  expect(overflowPx).toBeLessThanOrEqual(maxOverflowPx);
}

async function expectAppNavForViewport(page: Page, width: number): Promise<void> {
  const desktopSidebar = page.locator("aside").first();
  const mobileNav = page.getByRole("navigation", { name: "Primary" });

  if (width < 768) {
    await expect(desktopSidebar).toBeHidden();
    await expect(mobileNav).toBeVisible();
    return;
  }

  await expect(desktopSidebar).toBeVisible();
  await expect(mobileNav).toBeHidden();
}

test("app shell works across target breakpoints", async ({ page, request }) => {
  const seed = await createSeed(request);

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
  await expect(page).toHaveURL(/\/app\/lists/);

  for (const viewport of VIEWPORTS) {
    await test.step(`${viewport.label}px app shell`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/app/lists");

      await expect(page.getByRole("heading", { name: "Your Lists" })).toBeVisible();
      await expectAppNavForViewport(page, viewport.width);
      await expectHorizontalOverflowWithin(page, 0);
    });
  }
});

test("public list item actions stay visible across target breakpoints", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request);

  for (const viewport of VIEWPORTS) {
    await test.step(`${viewport.label}px public list`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/u/${seed.share_token}`);

      await expect(page.getByText("MAAP Jersey (Black)")).toBeVisible();
      await expect(page.getByRole("button", { name: "Buy gift" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Contribute" }).first()).toBeVisible();
    });
  }
});
