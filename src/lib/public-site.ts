export function getPublicSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}

export function toPublicUrl(path: string): string {
  const site = getPublicSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${site}${normalizedPath}`;
}
