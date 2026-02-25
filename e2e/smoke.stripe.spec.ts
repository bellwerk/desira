import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

const stripeE2EEnabled = process.env.PLAYWRIGHT_STRIPE_E2E === "true";
const hasConnectedAccount = Boolean(process.env.E2E_STRIPE_CONNECTED_ACCOUNT_ID);
const hasStripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);

test.describe("stripe checkout smoke (optional)", () => {
  test.skip(
    !stripeE2EEnabled || !hasConnectedAccount || !hasStripeSecret,
    "Set PLAYWRIGHT_STRIPE_E2E=true, E2E_STRIPE_CONNECTED_ACCOUNT_ID, and STRIPE_SECRET_KEY to run this spec."
  );

  test("guest can start real Stripe Checkout from contribute flow", async ({ page, request }) => {
    test.setTimeout(120_000);

    const seed = await createSeed(request);
    test.skip(
      !seed.stripe_ready,
      "Seed owner was not Stripe-ready. Ensure E2E_STRIPE_CONNECTED_ACCOUNT_ID is configured."
    );

    await page.goto(`/u/${seed.share_token}`);

    await page.getByRole("link", { name: "Contribute" }).first().click();
    await expect(page).toHaveURL(/\/u\/.+\/contribute\?item=/);

    await page.getByRole("button", { name: "Continue to Pay" }).click();
    await expect(page).toHaveURL(/\/u\/.+\/pay\?item=/);

    await page.getByRole("button", { name: "Pay" }).click();
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 45_000 });
  });
});
