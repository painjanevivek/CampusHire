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
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_admin" },
      next_step: "complete",
    });
    render(<AuthForm redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("College email"), { target: { value: "admin@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a long campus passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(csrfRequestMock).toHaveBeenCalledWith("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@example.edu",
        password: "a long campus passphrase",
      }),
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/dashboard"));
  });

  it("routes an administrator into mandatory MFA setup", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_admin" },
      next_step: "mfa_setup",
    });
    render(<AuthForm redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("College email"), { target: { value: "admin@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a secure passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup"));
  });

  it("opens the configured student demo through the backend without browser credentials", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "student-1", email: "student+demo@example.com", role: "student" },
      next_step: "complete",
    });
    render(<AuthForm demoRole="student" />);

    fireEvent.click(screen.getByRole("button", { name: "Use demo student account" }));

    expect(csrfRequestMock).toHaveBeenCalledWith("/auth/demo-sign-in", {
      method: "POST",
      body: JSON.stringify({ role: "student" }),
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("keeps mandatory MFA in the T&P demo flow", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin+demo@example.com", role: "tnp_admin" },
      next_step: "mfa_setup",
    });
    render(<AuthForm demoRole="tnp_admin" redirectTo="/admin/dashboard" />);

    fireEvent.click(screen.getByRole("button", { name: "Use demo T&P account" }));

    expect(csrfRequestMock).toHaveBeenCalledWith("/auth/demo-sign-in", {
      method: "POST",
      body: JSON.stringify({ role: "tnp_admin" }),
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup"));
  });

  it("does not render a demo action unless the server enables it", () => {
    render(<AuthForm />);
    expect(screen.queryByRole("button", { name: /demo/i })).not.toBeInTheDocument();
  });
});
