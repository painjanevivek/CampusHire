import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformAccounts } from "./platform-workspaces";

const { csrfRequestMock, refreshMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("institution=institution-one"),
}));
vi.mock("@/lib/api/client", () => ({
  csrfRequest: csrfRequestMock,
  ApiError: class ApiError extends Error {},
}));
vi.mock("@/features/experience/use-resource", () => ({
  useResource: (path: string) => ({
    data: path.includes("staff-accounts") ? [{
      id: "assignment-one", institution_id: "institution-one", user_id: "officer-one",
      username: "placement.officer", email: "placement.officer@example.invalid",
      role: "tnp_admin", status: "active", requires_terms_acceptance: false,
    }] : { items: [{ id: "institution-one", name: "Campus One" }] },
    loading: false,
    error: null,
    refresh: refreshMock,
  }),
}));

describe("PlatformAccounts", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset().mockResolvedValue({});
    refreshMock.mockReset();
  });

  it("assigns an existing T&P username to the selected institution", async () => {
    render(<PlatformAccounts />);
    fireEvent.click(screen.getByText("Assign an existing T&P account to this institution"));
    fireEvent.change(screen.getByLabelText("Existing username"), {
      target: { value: "placement.officer" },
    });
    fireEvent.change(screen.getByLabelText("Role at this institution"), {
      target: { value: "tnp_reviewer" },
    });
    const disclosure = screen.getByText("Assign an existing T&P account to this institution").closest("details")!;
    fireEvent.change(within(disclosure).getByLabelText("Audit reason"), {
      target: { value: "Officer covering assigned reviews here." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign account" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/institutions/institution-one/staff-assignments",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("placement.officer") }),
    ));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("requires an identity-check record before displaying a staff recovery code", async () => {
    csrfRequestMock.mockResolvedValue({ reset_code: "synthetic-staff-recovery-code", expires_in_minutes: 30 });
    render(<PlatformAccounts />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue manual recovery code" }));
    fireEvent.change(screen.getByLabelText("Identity check method"), {
      target: { value: "Verified helpdesk callback" },
    });
    fireEvent.change(screen.getByLabelText("Verification reference"), {
      target: { value: "synthetic-ticket-123" },
    });
    fireEvent.change(screen.getByLabelText("Recovery audit reason"), {
      target: { value: "Officer has lost account access." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue one-time code" }));
    expect(await screen.findByText("synthetic-staff-recovery-code")).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/staff-accounts/officer-one/manual-recovery",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("synthetic-ticket-123") }),
    );
  });
});
