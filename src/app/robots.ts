import type { MetadataRoute } from "next";
import { toPublicUrl } from "@/lib/public-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/api", "/auth", "/login", "/supabase-test"],
      },
    ],
    sitemap: toPublicUrl("/sitemap.xml"),
  };
}
