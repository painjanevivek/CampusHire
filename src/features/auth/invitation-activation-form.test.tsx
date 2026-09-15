import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationActivationForm } from "./invitation-activation-form";

const { apiRequestMock, csrfRequestMock, pushMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

describe("InvitationActivationForm", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("keeps a newly approved T&P owner on the institution onboarding journey", async () => {
    apiRequestMock.mockResolvedValue({
      id: "invitation-1",
      institution_id: "institution-1",
      email: "owner@example.edu",
      role: "tnp_owner",
      expires_at: "2026-09-14T00:00:00Z",
    });
    csrfRequestMock.mockResolvedValue({
      id: "owner-1",
      email: "owner@example.edu",
      role: "tnp_owner",
      institution_id: "institution-1",
    });

    render(<InvitationActivationForm token="owner-activation-token" />);
    expect(await screen.findByText("owner@example.edu")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Create password"), {
      target: { value: "a secure owner passphrase" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Activate account" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(
      "/tnp/mfa/setup?next=%2Ftnp%2Fonboarding",
    ));
  });
});
