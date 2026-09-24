import { describe, expect, it } from "vitest";

import { requiresPlacementAccess } from "./placement-route-guard";

describe("placement route guard", () => {
  it.each([
    "/dashboard",
    "/opportunities/role-1",
    "/applications",
    "/preparation",
    "/copilot",
    "/roadmap",
    "/resume/builder",
  ])("requires the backend placement capability for %s", (pathname) => {
    expect(requiresPlacementAccess(pathname)).toBe(true);
  });

  it.each(["/profile", "/privacy"])(
    "keeps account route %s available without placement access",
    (pathname) => {
      expect(requiresPlacementAccess(pathname)).toBe(false);
    },
  );
});
