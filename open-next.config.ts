import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // No overrides needed - default config is sufficient
  // Note: OpenNext CLI runs `pnpm build` which now correctly runs `next build`
});
