import { expect, type APIRequestContext } from "@playwright/test";

type SeedResult = {
  ok: boolean;
  visibility: "public" | "unlisted";
  share_token: string;
  public_url: string;
  stripe_ready?: boolean;
  demo_owner: {
    email: string;
    password: string;
    handle?: string;
  };
};

type SeedOptions = {
  visibility?: "public" | "unlisted";
};

export async function createSeed(
  request: APIRequestContext,
  options: SeedOptions = {}
): Promise<SeedResult> {
  const params = new URLSearchParams();
  if (options.visibility) {
    params.set("visibility", options.visibility);
  }

  const response = await request.get(
    params.size > 0 ? `/api/seed?${params.toString()}` : "/api/seed"
  );
  expect(response.ok(), "Seed endpoint should return 200").toBeTruthy();

  const json = (await response.json()) as SeedResult;
  expect(json.ok).toBeTruthy();
  expect(json.share_token).toBeTruthy();
  expect(json.demo_owner?.email).toBeTruthy();
  expect(json.demo_owner?.password).toBeTruthy();
  expect(json.visibility).toBeTruthy();

  return json;
}
