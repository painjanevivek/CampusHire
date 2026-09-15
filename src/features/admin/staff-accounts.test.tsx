import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StaffAccounts } from "./staff-accounts";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

describe("StaffAccounts", () => {
  beforeEach(() => {
    apiRequestMock.mockReset().mockImplementation((path: string) => {
      if (path === "/auth/me") {
        return Promise.resolve({
          id: "owner-1",
          institution_id: "institution-1",
          role: "tnp_owner",
        });
      }
      if (path.includes("/memberships?role=")) {
        return Promise.resolve({ items: [], page: 1, page_size: 100, total: 0 });
      }
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });
    csrfRequestMock.mockReset().mockResolvedValue({
      id: "membership-1",
      user_id: "officer-1",
      institution_id: "institution-1",
      username: "placement.officer",
      role: "tnp_reviewer",
      status: "active",
      requires_terms_acceptance: true,
    });
  });

  it("lets only the institution owner create scoped T&P credentials", async () => {
    render(<StaffAccounts />);
    expect(await screen.findByRole("heading", { name: "T&P accounts" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Officer username"), { target: { value: "placement.officer" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "tnp_reviewer" } });
    fireEvent.change(screen.getByLabelText("Initial password"), { target: { value: "a secure officer passphrase" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "a secure officer passphrase" } });
    fireEvent.change(screen.getByLabelText("Audit reason"), { target: { value: "Assigned to review student applications." } });
    fireEvent.click(screen.getByRole("button", { name: "Create T&P account" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/institutions/institution-1/staff-accounts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "placement.officer",
          password: "a secure officer passphrase",
          role: "tnp_reviewer",
          reason: "Assigned to review student applications.",
        }),
      }),
    ));
    expect(await screen.findByText(/can now sign in through the T&P workspace/i)).toBeInTheDocument();
  });

  it("does not expose creation controls to a non-owner T&P officer", async () => {
    apiRequestMock.mockResolvedValueOnce({
      id: "admin-1",
      institution_id: "institution-1",
      role: "tnp_admin",
    });
    render(<StaffAccounts />);

    expect(await screen.findByText("Admin access required")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create T&P account" })).not.toBeInTheDocument();
  });
});
