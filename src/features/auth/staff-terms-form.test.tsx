import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StaffTermsForm } from "./staff-terms-form";

const { csrfRequestMock, pushMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

describe("StaffTermsForm", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("records the officer's own acceptance before MFA setup", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "officer-1", email: "officer@example.edu", role: "tnp_reviewer" },
      next_step: "mfa_setup",
    });
    render(<StaffTermsForm />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Accept and continue" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/auth/terms/accept", {
      method: "POST",
      body: JSON.stringify({
        terms_version: "2026-08-28",
        privacy_version: "2026-08-28",
      }),
    }));
    expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup");
  });
});
