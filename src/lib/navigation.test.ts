import { describe, expect, it } from "vitest";

import { safeInternalHref } from "./navigation";

describe("safeInternalHref", () => {
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/../admin"])(
    "rejects unsafe navigation target %s",
    (target) => expect(safeInternalHref(target)).toBe("/dashboard"),
  );

  it("keeps application-owned routes", () => {
    expect(safeInternalHref("/opportunities/role-1?from=dashboard")).toBe(
      "/opportunities/role-1?from=dashboard",
    );
  });
});
