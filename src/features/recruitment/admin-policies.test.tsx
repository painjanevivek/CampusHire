import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";
import { AdminPolicies } from "./admin-policies";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
  csrfRequest: vi.fn(),
}));

const policy = {
  id: "policy-1",
  title: "Placement policy",
  version: 1,
  source_reference: "Registrar circular 2026-08",
  sections: [{ section: "Eligibility", page: 1, text: "Reviewed rule" }],
  status: "draft",
  created_by_user_id: "officer-1",
  reviewed_by_user_id: null,
  review_reason: null,
  approved_at: null,
};

describe("policy authority controls", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockResolvedValue([policy]);
  });

  it("keeps policy mutation controls out of the Reviewer workspace", async () => {
    render(<AdminPolicies role="tnp_reviewer" />);

    expect(await screen.findByText("Placement policy")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add policy version/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  it("keeps policy lifecycle controls available to full Officers", async () => {
    render(<AdminPolicies role="tnp_admin" />);

    expect(await screen.findByText("Placement policy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add policy version/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });
});
