import { describe, expect, it } from "vitest";

import { canAccessTnpPath, tnpHomeForRole } from "./workspace-access";

describe("T&P workspace route access", () => {
  it.each(["tnp_owner", "tnp_admin"])(
    "allows full Officers to operate all institution routes",
    (role) => {
      expect(canAccessTnpPath(role, "/tnp/drives")).toBe(true);
      expect(canAccessTnpPath(role, "/tnp/students")).toBe(true);
      expect(canAccessTnpPath(role, "/tnp/privacy")).toBe(true);
    },
  );

  it("limits Reviewers to assigned work and approved policy context", () => {
    expect(canAccessTnpPath("tnp_reviewer", "/tnp/dashboard")).toBe(true);
    expect(canAccessTnpPath("tnp_reviewer", "/tnp/applications/case-1")).toBe(true);
    expect(canAccessTnpPath("tnp_reviewer", "/tnp/policies")).toBe(true);
    expect(canAccessTnpPath("tnp_reviewer", "/tnp/drives")).toBe(false);
    expect(canAccessTnpPath("tnp_reviewer", "/tnp/students")).toBe(false);
  });

  it("limits Auditors to assurance records", () => {
    expect(canAccessTnpPath("tnp_auditor", "/tnp/reports")).toBe(true);
    expect(canAccessTnpPath("tnp_auditor", "/tnp/audit")).toBe(true);
    expect(canAccessTnpPath("tnp_auditor", "/tnp/applications")).toBe(false);
    expect(canAccessTnpPath("tnp_auditor", "/tnp/companies")).toBe(false);
  });

  it("fails closed for unknown roles and non-T&P paths", () => {
    expect(canAccessTnpPath("platform_admin", "/tnp/dashboard")).toBe(false);
    expect(canAccessTnpPath("unknown", "/tnp/dashboard")).toBe(false);
    expect(canAccessTnpPath("tnp_admin", "/admin/dashboard")).toBe(false);
    expect(tnpHomeForRole("unknown")).toBe("/unauthorized");
  });

  it("sends each narrow role to its authorized landing page", () => {
    expect(tnpHomeForRole("tnp_reviewer")).toBe("/tnp/dashboard");
    expect(tnpHomeForRole("tnp_auditor")).toBe("/tnp/reports");
    expect(tnpHomeForRole("tnp_admin")).toBe("/tnp/dashboard");
  });
});
