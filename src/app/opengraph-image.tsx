import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";
export const alt = "CampusHire AI — accountable campus recruitment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f6f5ef", color: "#102b2a", fontFamily: "sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700, color: "#1845b8" }}><BrandMark style={{ width: 48, height: 48 }} />CampusHire AI</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 78, fontWeight: 750, letterSpacing: "-4px", maxWidth: 930 }}>Placement records students can understand.</div><div style={{ marginTop: 28, fontSize: 26, color: "#49615f" }}>Verified details. Clear eligibility. Human decisions.</div></div></div>, size);
}
