import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readStyle = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("shared typography", () => {
  it("uses the landing-page font roles across common content and controls", () => {
    const globals = readStyle("src/app/globals.css");

    expect(globals).toMatch(/body\s*\{[^}]*font-family: var\(--font-body\)/s);
    expect(globals).toMatch(/h1, h2, h3\s*\{[^}]*font-family: var\(--font-body\)/s);
    expect(globals).toMatch(/button, \.button, nav, \.brand\s*\{[^}]*font-family: var\(--font-interface\)/s);
    expect(globals).toMatch(/h1 em, h2 em, h3 em\s*\{[^}]*font-family: var\(--font-display\)/s);
    expect(globals).toMatch(/code, kbd, samp, pre\s*\{[^}]*font-family: var\(--font-mono\)/s);
  });

  it("uses shared font tokens in profile and résumé UI", () => {
    const profile = readStyle("src/features/profile/profile-workspace.module.css");
    const resume = readStyle("src/features/resume/resume-builder.module.css");

    expect(profile).toMatch(/\.identifier\s*\{[^}]*font-family: var\(--font-mono\)/s);
    expect(resume).toMatch(/\.templateName\s*\{[^}]*font-family: var\(--font-interface\)/s);
    expect(resume).not.toContain("var(--font-sans)");
  });
});
