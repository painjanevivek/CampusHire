import { describe, expect, it } from "vitest";

import { isAdministratorRole } from "./server-session";

describe("administrator session roles", () => {
  it.each(["tnp_owner", "tnp_admin", "tnp_reviewer", "tnp_auditor"])(
    "accepts %s in the administrator lane",
    (role) => expect(isAdministratorRole(role)).toBe(true),
  );

  it.each(["student", "unknown", ""])("rejects %s from the administrator lane", (role) => {
    expect(isAdministratorRole(role)).toBe(false);
  });
});
