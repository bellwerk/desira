import { expect, test } from "@playwright/test";
import { createSeed } from "./helpers/seed";

function extractFirstItemIdFromHtml(html: string): string {
  const match = html.match(/\/api\/go\/([0-9a-f-]{36})\?token=/i);
  if (!match?.[1]) {
    throw new Error("Could not extract item id from public list HTML");
  }
  return match[1];
}

test("two guest contexts enforce reservation lock", async ({ browser, request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await pageA.goto(`/u/${seed.share_token}`);
    await pageB.goto(`/u/${seed.share_token}`);

    await pageA.getByRole("button", { name: "Buy gift" }).first().click();
    await expect(pageA).toHaveURL(/\/u\/.+\/reserve\?item=/);
    await expect(pageA.getByRole("button", { name: "Reserve only (24h)" })).toBeVisible();
    await pageA.getByRole("button", { name: "Reserve only (24h)" }).click();
    await expect(pageA).toHaveURL(new RegExp(`/u/${seed.share_token}$`));

    await pageB.reload();
    const buyButtonB = pageB.getByRole("button", { name: "Buy gift" }).first();
    await expect(buyButtonB).toBeVisible();
    await buyButtonB.click();
    await expect(pageB.getByText("Gift reserved")).toBeVisible();
    await expect(pageB.getByText("Reserved until")).toBeVisible();
    await expect(pageB.getByRole("button", { name: "Contribute" }).first()).toBeDisabled();

    await pageB.goto(`/u/${seed.share_token}/reserve?item=${itemId}`);
    await expect(pageB.getByText("Could not hold this gift")).toBeVisible();

    await pageA.getByRole("button", { name: "Undo hold" }).click();
    await expect(
      pageA.getByRole("alert").filter({ hasText: "Hold removed. This gift is available again." })
    ).toBeVisible();

    await pageB.goto(`/u/${seed.share_token}`);
    await pageB.reload();
    await pageB.getByRole("button", { name: "Buy gift" }).first().click();
    await expect(pageB).toHaveURL(/\/u\/.+\/reserve\?item=/);
    await expect(pageB.getByRole("button", { name: "Reserve only (24h)" })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
