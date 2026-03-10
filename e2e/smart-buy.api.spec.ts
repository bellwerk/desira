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

test("pending purchase endpoint shows reserved+clicked gift and clears after mark-purchased", async ({
  request,
}) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);
  const deviceToken = randomUUID();

  const reserveRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken,
      share_token: seed.share_token,
    },
  });
  const reserveJson = await reserveRes.json().catch(() => null);
  expect(reserveRes.status(), JSON.stringify(reserveJson)).toBe(200);
  const cancelToken =
    typeof reserveJson?.cancel_token === "string" ? reserveJson.cancel_token : null;
  expect(cancelToken).toBeTruthy();

  const clickRes = await request.post(`/api/gifts/${itemId}/affiliate-click`, {
    data: {
      deviceToken,
      cancelToken: cancelToken ?? undefined,
      share_token: seed.share_token,
    },
  });
  expect(clickRes.status()).toBe(200);
  await expect(clickRes.json()).resolves.toMatchObject({
    ok: true,
  });

  const pendingRes = await request.post("/api/gifts/pending-purchase", {
    data: {
      deviceToken,
      cancelToken: cancelToken ?? undefined,
      share_token: seed.share_token,
    },
  });
  expect(pendingRes.status()).toBe(200);
  await expect(pendingRes.json()).resolves.toMatchObject({
    ok: true,
    item: { item_id: itemId },
  });

  const contributeOnReservedRes = await request.post(
    `/api/gifts/${itemId}/contribute/create-session`,
    {
      data: {
        token: seed.share_token,
        contribution_cents: 500,
      },
    }
  );
  expect(contributeOnReservedRes.status()).toBe(409);

  const purchasedRes = await request.post(`/api/gifts/${itemId}/mark-purchased`, {
    data: {
      deviceToken,
      cancelToken: cancelToken ?? undefined,
      share_token: seed.share_token,
    },
  });
  expect(purchasedRes.status()).toBe(200);

  const pendingAfterRes = await request.post("/api/gifts/pending-purchase", {
    data: {
      deviceToken,
      cancelToken: cancelToken ?? undefined,
      share_token: seed.share_token,
    },
  });
  expect(pendingAfterRes.status()).toBe(200);
  await expect(pendingAfterRes.json()).resolves.toMatchObject({
    ok: true,
    item: null,
  });

  const contributeOnPurchasedRes = await request.post(
    `/api/gifts/${itemId}/contribute/create-session`,
    {
      data: {
        token: seed.share_token,
        contribution_cents: 500,
      },
    }
  );
  expect(contributeOnPurchasedRes.status()).toBe(409);
  await expect(contributeOnPurchasedRes.json()).resolves.toMatchObject({
    error: "Item is already purchased.",
  });
});

test("cancel-reservation endpoint releases lock for the owning device token", async ({ request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);
  const deviceToken = randomUUID();

  const reserveRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken,
      share_token: seed.share_token,
    },
  });
  const reserveJson = await reserveRes.json().catch(() => null);
  expect(reserveRes.status(), JSON.stringify(reserveJson)).toBe(200);
  const cancelToken =
    typeof reserveJson?.cancel_token === "string" ? reserveJson.cancel_token : null;
  expect(cancelToken).toBeTruthy();

  const cancelRes = await request.post(`/api/gifts/${itemId}/cancel-reservation`, {
    data: {
      deviceToken,
      cancelToken: cancelToken ?? undefined,
      share_token: seed.share_token,
    },
  });
  expect(cancelRes.status()).toBe(200);
  await expect(cancelRes.json()).resolves.toMatchObject({
    ok: true,
  });

  const secondReserveRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken: randomUUID(),
      share_token: seed.share_token,
    },
  });
  expect(secondReserveRes.status()).toBe(200);
});

test("owner mark-received endpoint blocks future reserve attempts", async ({ page, request }) => {
  const seed = await createSeed(request, { visibility: "public" });
  const listHtml = await (await request.get(`/u/${seed.share_token}`)).text();
  const itemId = extractFirstItemIdFromHtml(listHtml);

  await loginAsSeededOwner(page, seed.demo_owner.email, seed.demo_owner.password, "/app/lists");

  const markReceivedRes = await page.request.post(`/api/gifts/${itemId}/mark-received`);
  const markReceivedJson = await markReceivedRes.json().catch(() => null);
  expect(markReceivedRes.status(), JSON.stringify(markReceivedJson)).toBe(200);
  expect(markReceivedJson).toMatchObject({
    ok: true,
    item: { id: itemId, status: "received" },
  });

  const reserveAfterReceivedRes = await request.post(`/api/gifts/${itemId}/reserve`, {
    data: {
      deviceToken: randomUUID(),
      share_token: seed.share_token,
    },
  });
  expect(reserveAfterReceivedRes.status()).toBe(409);

  const contributeAfterReceivedRes = await request.post(
    `/api/gifts/${itemId}/contribute/create-session`,
    {
      data: {
        token: seed.share_token,
        contribution_cents: 500,
      },
    }
  );
  expect(contributeAfterReceivedRes.status()).toBe(409);
});
