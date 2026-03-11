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

async function openShareModal(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Desira Demo List" }).first().click();
  await expect(page).toHaveURL(/\/app\/lists\/.+/);

  await page.getByRole("button", { name: "Share list" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Share list" })).toBeVisible();
}

test("owner share modal provides copy, share, and preview actions on desktop and mobile", async ({
  page,
  request,
}) => {
  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  await test.step("desktop", async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/app/lists");
    await openShareModal(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Copy public link" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Share list" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Preview public list" })).toBeVisible();

    await dialog.getByRole("button", { name: "Copy public link" }).click();
  });

  await test.step("mobile", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/app/lists");
    await openShareModal(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Copy public link" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Share list" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Preview public list" })).toBeVisible();
  });
});

test("native share success toast appears only after share resolves", async ({ page, request }) => {
  await page.addInitScript(() => {
    let resolver: (() => void) | null = null;
    (window as Window & { __resolveNativeShare?: () => void }).__resolveNativeShare = () => {
      resolver?.();
      resolver = null;
    };

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: () =>
        new Promise<void>((resolve) => {
          resolver = resolve;
        }),
    });
  });

  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
  await openShareModal(page);

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Share list" }).click();

  const successToast = page.getByRole("alert").filter({ hasText: "Share sheet opened." });
  await expect(successToast).toHaveCount(0);

  await page.evaluate(() => {
    (window as Window & { __resolveNativeShare?: () => void }).__resolveNativeShare?.();
  });
  await expect(successToast).toBeVisible();
});

test("native share abort does not show success or error toasts", async ({ page, request }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Canceled", "AbortError");
      },
    });
  });

  const seed = await createSeed(request);
  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
  await openShareModal(page);

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Share list" }).click();
  await expect(dialog.getByRole("button", { name: "Share list" })).toBeVisible();

  await expect(page.getByRole("alert").filter({ hasText: "Share sheet opened." })).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "Could not open the share sheet." })).toHaveCount(0);
});
