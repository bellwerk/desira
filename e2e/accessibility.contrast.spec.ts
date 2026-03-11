import AxeBuilder from "@axe-core/playwright";
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

function formatContrastViolations(
  violations: ReadonlyArray<{ id: string; impact?: string | null; nodes: Array<{ target: unknown }> }>
): string {
  return violations
    .map((violation) => {
      const sampleTargets = violation.nodes
        .slice(0, 3)
        .map((node) =>
          Array.isArray(node.target)
            ? node.target.map((segment) => String(segment)).join(" ")
            : String(node.target)
        )
        .join(" | ");
      return `${violation.id} (${violation.impact ?? "unknown"}) -> ${sampleTargets}`;
    })
    .join("\n");
}

async function expectNoColorContrastViolations(page: Page, screenName: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  const violations = results.violations;

  expect(
    violations.length,
    `${screenName} has color-contrast violations:\n${formatContrastViolations(violations)}`
  ).toBe(0);
}

async function expectNoColorContrastViolationsInScope(
  page: Page,
  screenName: string,
  selector: string
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .include(selector)
    .analyze();
  const violations = results.violations;

  expect(
    violations.length,
    `${screenName} has color-contrast violations:\n${formatContrastViolations(violations)}`
  ).toBe(0);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`color contrast (${colorScheme})`, () => {
    test.use({ colorScheme });

    test("login page meets AA contrast baseline", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "Your wishes await" })).toBeVisible();
      await expectNoColorContrastViolations(page, `login page (${colorScheme})`);
    });

    test("owner list flows meet AA contrast baseline", async ({ page, request }) => {
      const seed = await createSeed(request);

      await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");
      await expect(page.getByRole("link", { name: "Desira Demo List" }).first()).toBeVisible();
      await expect(page.getByText("Loading lists...")).toHaveCount(0);
      await expectNoColorContrastViolations(page, `owner lists page (${colorScheme})`);

      await page.getByRole("link", { name: "Desira Demo List" }).first().click();
      await expect(page).toHaveURL(/\/app\/lists\/.+/);
      await expect(page.getByText("Loading list...")).toHaveCount(0);
      await page.waitForTimeout(900);
      await expectNoColorContrastViolations(page, `owner list detail (${colorScheme})`);

      await page.getByRole("button", { name: "Share list" }).click();
      await expect(page.getByRole("heading", { name: "Share list" })).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoColorContrastViolationsInScope(
        page,
        `owner share modal (${colorScheme})`,
        "[role='dialog']"
      );
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Add New Wish" }).click();
      await expect(page.getByRole("heading", { name: "Add Wish" })).toBeVisible();
      await page.waitForTimeout(350);
      await expectNoColorContrastViolationsInScope(
        page,
        `owner add wish modal (${colorScheme})`,
        "[role='dialog']"
      );

      await page.getByRole("button", { name: "Add Manually" }).click();
      await expect(page.getByRole("heading", { name: "Wish Details" })).toBeVisible();
      await page.waitForTimeout(350);
      await expectNoColorContrastViolationsInScope(
        page,
        `owner wish details modal (${colorScheme})`,
        "[role='dialog']"
      );
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "List Settings" }).click();
      await expect(page.getByRole("heading", { name: "List Settings" })).toBeVisible();
      await page.waitForTimeout(350);
      await expectNoColorContrastViolations(page, `owner list settings modal (${colorScheme})`);
    });

    test("public share and contribution flow meet AA contrast baseline", async ({ page, request }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("desira_cookie_consent", "accepted");
      });
      const seed = await createSeed(request, { visibility: "public" });

      await page.goto(`/u/${seed.share_token}`);
      await expect(page.getByText("MAAP Jersey (Black)")).toBeVisible();
      await page.waitForTimeout(900);
      await expectNoColorContrastViolations(page, `public list page (${colorScheme})`);

      await page.getByRole("link", { name: "Contribute" }).first().click();
      await expect(page).toHaveURL(/\/u\/.+\/contribute\?item=/);
      await page.waitForTimeout(900);
      await expectNoColorContrastViolations(page, `public contribute page (${colorScheme})`);

      await page.getByRole("button", { name: "$50" }).click();
      await page.getByRole("button", { name: "Continue to Pay" }).click();
      await expect(page).toHaveURL(/\/u\/.+\/pay\?item=/);
      await page.waitForTimeout(900);
      await expectNoColorContrastViolations(page, `public pay page (${colorScheme})`);
    });
  });
}
