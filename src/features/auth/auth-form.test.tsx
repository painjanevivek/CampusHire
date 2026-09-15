import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const { csrfRequestMock, pushMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

describe("AuthForm", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("honors the separate administrator destination", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_owner" },
      next_step: "complete",
    });
    render(<AuthForm workspace="admin" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a long campus passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(csrfRequestMock).toHaveBeenCalledWith("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({
        identifier: "admin",
        password: "a long campus passphrase",
        workspace: "admin",
      }),
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/dashboard"));
  });

  it("routes an administrator into mandatory MFA setup", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_admin" },
      next_step: "mfa_setup",
    });
    render(<AuthForm workspace="tnp" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "tnp" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a secure passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup"));
  });

  it("preserves institution onboarding as the owner destination through MFA setup", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "owner-1", email: "owner@example.edu", role: "tnp_owner" },
      next_step: "mfa_setup",
    });
    render(<AuthForm workspace="admin" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a secure passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup?next=%2Fadmin%2Fonboarding"));
  });

  it("routes a newly provisioned officer through personal terms acceptance", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "officer-1", email: "officer@example.edu", role: "tnp_reviewer" },
      next_step: "terms_acceptance",
    });
    render(<AuthForm workspace="tnp" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "officer" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a secure passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/accept-terms"));
  });

  it("never renders demo or public signup actions", () => {
    render(<AuthForm workspace="student" />);
    expect(screen.getByLabelText("College email")).toHaveAttribute("type", "email");
    expect(screen.queryByRole("button", { name: /demo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
  });

  it("uses a blank username field for staff workspaces", () => {
    render(<AuthForm workspace="admin" />);

    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.queryByLabelText("College email")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });
});
