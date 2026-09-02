import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("MVP scope boundary", () => {
  it.each([
    "src/app/(student)/opportunities/demo/page.tsx",
    "src/app/admin/(protected)/drives/demo/page.tsx",
    "src/features/opportunities/opportunity-detail.tsx",
    "src/features/opportunities/opportunities-workspace.tsx",
    "src/features/admin/admin-section-placeholder.tsx",
  ])("does not ship the retired fixture or placeholder %s", (path) => {
    expect(existsSync(resolve(root, path))).toBe(false);
  });

  it("keeps public account creation out of the browser sign-in bundle", () => {
    const source = readFileSync(
      resolve(root, "src/features/auth/auth-form.tsx"),
      "utf8",
    );

    expect(source).not.toContain("/auth/signup");
    expect(source).not.toContain('"sign-up"');
  });
});
