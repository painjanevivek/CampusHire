import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  join(process.cwd(), "src/features/marketing/editorial-landing.module.css"),
  "utf8",
);

describe("EditorialLanding typography", () => {
  it("uses a bounded fluid scale for landing-page text", () => {
    expect(stylesheet).toContain("--ch-text-sm: clamp(");
    expect(stylesheet).toContain("--ch-text: clamp(");
    expect(stylesheet).toContain("--ch-display: clamp(");
    expect(stylesheet).toContain("--ch-section: clamp(");
    expect(stylesheet).toMatch(/@media \(max-width: 780px\)\s*\{[\s\S]*--ch-display: clamp\(/);
  });

  it("applies the fluid scale to navigation, supporting copy, and headings", () => {
    expect(stylesheet).toMatch(/\.headerActions a\s*\{[^}]*font-size: var\(--ch-text-sm\)/s);
    expect(stylesheet).toMatch(/\.heroDescription\s*\{[^}]*font-size: clamp\(/s);
    expect(stylesheet).toMatch(/\.journeySteps article > p\s*\{[^}]*font-size: var\(--ch-text\)/s);
    expect(stylesheet).toMatch(/\.hero h1\s*\{[^}]*font-size: var\(--ch-display\)/s);
  });
});
