import { randomUUID } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "./helpers/seed";

function extractFirstItemIdFromHtml(html: string): string {
  const match = html.match(/\/api\/go\/([0-9a-f-]{36})\?token=/i);
  if (!match?.[1]) {
    throw new Error("Could not extract item id from public list HTML");
  }
  return match[1];
}

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

test("owner undo-received restores reserve availability", async ({ page, request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  const markReceivedRes = await page.request.post(`/api/gifts/${itemId}/mark-received`);
  const markReceivedJson = await markReceivedRes.json().catch(() => null);
  expect(markReceivedRes.status(), JSON.stringify(markReceivedJson)).toBe(200);

  const undoRes = await page.request.post(`/api/gifts/${itemId}/undo-received`, {
    data: {
      previousStatus: "active",
    },
  });
  const undoJson = await undoRes.json().catch(() => null);
  expect(undoRes.status(), JSON.stringify(undoJson)).toBe(200);
  expect(undoJson).toMatchObject({
    ok: true,
    item: {
      id: itemId,
      status: "active",
    },
  });

  const reserveRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken: randomUUID(),
      share_token: seed.share_token,
    },
  });
  const reserveJson = await reserveRes.json().catch(() => null);
  expect(reserveRes.status(), JSON.stringify(reserveJson)).toBe(200);
});

test("owner outbound buy click does not create reservation lock", async ({ page, request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  const ownerGoRes = await page.request.get(`/api/go/${itemId}`, {
    maxRedirects: 0,
  });
  expect([302, 303, 307, 308]).toContain(ownerGoRes.status());

  const reserveRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken: randomUUID(),
      share_token: seed.share_token,
    },
  });
  const reserveJson = await reserveRes.json().catch(() => null);
  expect(reserveRes.status(), JSON.stringify(reserveJson)).toBe(200);
});
