import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  join(process.cwd(), "src/features/marketing/editorial-landing.module.css"),
  "utf8",
);

describe("EditorialLanding typography", () => {
  it("uses a bounded fluid scale for landing-page text", () => {
    expect(stylesheet).toContain("--landing-text-xs: clamp(");
    expect(stylesheet).toContain("--landing-text-sm: clamp(");
    expect(stylesheet).toContain("--landing-text-base: clamp(");
    expect(stylesheet).toContain("--landing-text-lg: clamp(");
    expect(stylesheet).toContain("--landing-display-hero: clamp(");
    expect(stylesheet).toContain("--landing-display-section: clamp(");
  });

  it("applies the fluid scale to navigation, supporting copy, and headings", () => {
    expect(stylesheet).toMatch(/\.header nav a\s*\{[^}]*font-size: var\(--landing-text-sm\)/s);
    expect(stylesheet).toMatch(/\.heroDescription\s*\{[^}]*font-size: var\(--landing-text-lg\)/s);
    expect(stylesheet).toMatch(/\.journey li p\s*\{[^}]*font-size: var\(--landing-text-base\)/s);
    expect(stylesheet).toMatch(/\.hero h1\s*\{[^}]*font-size: var\(--landing-display-hero\)/s);
  });
});
