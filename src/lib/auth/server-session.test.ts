import { describe, expect, it } from "vitest";

import { isAdministratorRole } from "./server-session";

describe("administrator session roles", () => {
  it("accepts only the platform administrator in the administrator lane", () => {
    expect(isAdministratorRole("platform_admin")).toBe(true);
  });

  it.each(["tnp_owner", "tnp_admin", "tnp_reviewer", "tnp_auditor", "student", "unknown", ""])(
    "rejects %s from the administrator lane",
    (role) => expect(isAdministratorRole(role)).toBe(false),
  );
});
