import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAccountWorkspace } from "./admin-account-workspace";

const { apiRequestMock, csrfRequestMock, replaceMock, refreshMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));
vi.mock("./communication-preferences", () => ({
  CommunicationPreferences: () => <div>Administrator email preference controls</div>,
}));

describe("AdminAccountWorkspace", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset().mockResolvedValue(undefined);
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("shows assigned identity while progressively disclosing account controls", () => {
    render(<AdminAccountWorkspace user={{
      id: "admin-1",
      email: "placement@college.edu",
      role: "tnp_admin",
      institution_id: "institution-1",
      membership_status: "active",
    }} />);

    expect(screen.getAllByText("placement@college.edu")).toHaveLength(2);
    expect(screen.getAllByText("T&P administrator")).toHaveLength(2);
    expect(screen.queryByText("Administrator email preference controls")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Email notifications/ }));

    expect(screen.getByText("Administrator email preference controls")).toBeInTheDocument();
  });

  it("requires both factors before routing to immediate authenticator reenrollment", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminAccountWorkspace user={{
      id: "owner-1",
      email: "owner@college.edu",
      role: "tnp_owner",
      institution_id: "institution-1",
      membership_status: "active",
    }} />);

    expect(screen.getAllByText("T&P owner")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Reset authenticator/ }));
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "secure passphrase" } });
    fireEvent.change(screen.getByLabelText("Authenticator or recovery code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset authenticator" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/mfa/disable",
      {
        method: "POST",
        body: JSON.stringify({ password: "secure passphrase", code: "123456" }),
      },
    ));
    expect(replaceMock).toHaveBeenCalledWith("/admin/mfa/setup");
    expect(refreshMock).toHaveBeenCalled();
  });
});
