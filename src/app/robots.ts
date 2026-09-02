import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { rules: { userAgent: "*", allow: ["/", "/docs", "/help", "/privacy", "/terms", "/status"], disallow: ["/admin", "/dashboard", "/profile", "/applications", "/opportunities", "/resume", "/roadmap", "/activate", "/reset-password"] }, sitemap: `${base}/sitemap.xml` };
}
