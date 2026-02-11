type ProfileIdentityInput = {
  userId: string;
  email?: string | null;
  metadataName?: unknown;
};

type ProfileIdentity = {
  display_name: string;
  handle: string;
};

const HANDLE_FALLBACK = "user";

function normalizeText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(value: string): string {
  const normalized = normalizeText(value).toLowerCase().trim();
  const compact = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return compact || HANDLE_FALLBACK;
}

export function buildProfileIdentity(input: ProfileIdentityInput): ProfileIdentity {
  const metadataName =
    typeof input.metadataName === "string" ? input.metadataName.trim() : "";
  const emailLocal = input.email?.split("@")[0]?.trim() ?? "";

  const display_name =
    metadataName || emailLocal || `User ${input.userId.slice(0, 8)}`;

  const baseHandle = slugify(metadataName || emailLocal || HANDLE_FALLBACK);
  const userSuffix = input.userId.replace(/-/g, "").slice(0, 8) || "00000000";

  return {
    display_name,
    handle: `${baseHandle}-${userSuffix}`,
  };
}
