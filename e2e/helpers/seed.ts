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

const MAX_SEED_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 400;
const RETRYABLE_STATUS_CODES = new Set([404, 408, 425, 429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

export async function createSeed(
  request: APIRequestContext,
  options: SeedOptions = {}
): Promise<SeedResult> {
  const params = new URLSearchParams();
  if (options.visibility) {
    params.set("visibility", options.visibility);
  }
  const seedUrl = params.size > 0 ? `/api/seed?${params.toString()}` : "/api/seed";

  let responseText = "";
  let status = 0;
  let lastFailureMessage = "";
  let delayMs = INITIAL_RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_SEED_ATTEMPTS; attempt += 1) {
    const response = await request.get(seedUrl);
    status = response.status();
    responseText = await response.text();

    if (response.ok()) {
      let json: SeedResult;
      try {
        json = JSON.parse(responseText) as SeedResult;
      } catch {
        throw new Error(
          `[createSeed] ${seedUrl} returned non-JSON body with 200 status: ${truncate(responseText, 2000)}`
        );
      }
      expect(json.ok).toBeTruthy();
      expect(json.share_token).toBeTruthy();
      expect(json.demo_owner?.email).toBeTruthy();
      expect(json.demo_owner?.password).toBeTruthy();
      expect(json.visibility).toBeTruthy();
      return json;
    }

    lastFailureMessage = `[createSeed] ${seedUrl} failed (attempt ${attempt}/${MAX_SEED_ATTEMPTS}) status=${status} body=${truncate(responseText, 2000)}`;

    if (attempt === MAX_SEED_ATTEMPTS || !RETRYABLE_STATUS_CODES.has(status)) {
      break;
    }

    // Give dev server/Supabase a short window to finish bootstrapping.
    // This significantly reduces flaky setup failures in CI.
    console.error(`${lastFailureMessage} retrying in ${delayMs}ms`);
    await delay(delayMs);
    delayMs *= 2;
  }

  expect(
    false,
    `Seed endpoint should return 200. status=${status}. details=${lastFailureMessage}`
  ).toBeTruthy();

  throw new Error("Unreachable: createSeed expectation should have failed above.");
}
