import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPolicies } from "./admin-policies";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const policy = {
  id: "policy-1",
  title: "Placement policy",
  version: 1,
  source_reference: "Registrar circular 2026-08",
  sections: [
    {
      section: "Section 1",
      page: 1,
      text: "Missing evidence requires review.",
    },
  ],
  status: "draft",
  review_reason: null,
  approved_at: null,
  created_at: "2026-08-24T00:00:00Z",
  updated_at: "2026-08-24T00:00:00Z",
};

describe("AdminPolicies", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([policy]);
    vi.spyOn(window, "prompt").mockReturnValue(
      "Verified against the signed registrar circular.",
    );
  });

  it("keeps staged policy evidence out of retrieval until an explicit review", async () => {
    csrfRequestMock.mockResolvedValue({ ...policy, status: "approved" });
    render(<AdminPolicies />);
    expect(await screen.findByText("Placement policy")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Find cited evidence" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/admin/intelligence/policies/policy-1/review",
        expect.objectContaining({
          body: expect.stringContaining("registrar circular"),
        }),
      ),
    );
  });
});
