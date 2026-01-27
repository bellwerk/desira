import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Use dedicated build:next script to avoid infinite recursion
  // (default calls `pnpm run build` which would call opennextjs-cloudflare again)
  buildCommand: "pnpm run build:next",
});
