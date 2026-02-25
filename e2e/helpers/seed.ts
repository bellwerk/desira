import { expect, type APIRequestContext } from "@playwright/test";

type SeedResult = {
  ok: boolean;
  share_token: string;
  public_url: string;
  stripe_ready?: boolean;
  demo_owner: {
    email: string;
    password: string;
  };
};

export async function createSeed(request: APIRequestContext): Promise<SeedResult> {
  const response = await request.get("/api/seed");
  expect(response.ok(), "Seed endpoint should return 200").toBeTruthy();

  const json = (await response.json()) as SeedResult;
  expect(json.ok).toBeTruthy();
  expect(json.share_token).toBeTruthy();
  expect(json.demo_owner?.email).toBeTruthy();
  expect(json.demo_owner?.password).toBeTruthy();

  return json;
}
