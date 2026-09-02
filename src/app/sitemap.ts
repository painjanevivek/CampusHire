import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = ["", "/docs", "/help", "/terms", "/privacy", "/accessibility", "/security", "/acceptable-use", "/data-rights", "/appeals", "/status"];
  return routes.map((route) => ({ url: `${base}${route}`, changeFrequency: "monthly", priority: route === "" ? 1 : 0.5 }));
}
