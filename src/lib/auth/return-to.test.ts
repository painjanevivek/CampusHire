import { describe, expect, it } from "vitest";

import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("preserves a safe relative route and query", () => {
    expect(safeReturnTo("/opportunities?mode=remote", "/dashboard"))
      .toBe("/opportunities?mode=remote");
  });

  it.each([
    "https://evil.example/collect",
    "//evil.example/collect",
    "/admin/../dashboard",
    "/admin/%2e%2e/dashboard",
    "/dashboard%0aSet-Cookie:unsafe",
    "/dashboard#private-fragment",
  ])("rejects an unsafe return target: %s", (value) => {
    expect(safeReturnTo(value, "/dashboard")).toBe("/dashboard");
  });

  it("keeps administrator returns inside the administrator lane", () => {
    expect(safeReturnTo("/admin/applications?page=2", "/admin/dashboard", "/admin/"))
      .toBe("/admin/applications?page=2");
    expect(safeReturnTo("/dashboard", "/admin/dashboard", "/admin/"))
      .toBe("/admin/dashboard");
  });
});
