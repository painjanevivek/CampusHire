import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "CampusHire AI", short_name: "CampusHire", description: "Accountable campus recruitment and career readiness.", start_url: "/", display: "standalone", background_color: "#f6f5ef", theme_color: "#083c3a", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
