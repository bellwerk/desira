import { expect, test } from "@playwright/test";

test("error tracking endpoint accepts valid client payloads", async ({ request }) => {
  const response = await request.post("/api/errors", {
    data: {
      source: "client",
      scope: "e2e.error-tracking",
      message: "Synthetic client boundary error",
      name: "Error",
      stack: "Error: Synthetic client boundary error",
      digest: "e2e-digest",
      metadata: { feature: "error-tracking" },
      timestamp: new Date().toISOString(),
    },
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ ok: true });
});

test("error tracking endpoint rejects invalid payloads", async ({ request }) => {
  const response = await request.post("/api/errors", {
    data: {
      source: "server",
      scope: "",
      message: "",
    },
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: { code: "INVALID_PAYLOAD" },
  });
});
