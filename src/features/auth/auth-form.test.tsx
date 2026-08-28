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

  it("takes a newly created student directly to resumable onboarding", async () => {
    csrfRequestMock.mockResolvedValue({ id: "student-1", email: "student@example.edu", role: "student" });
    render(<AuthForm mode="sign-up" />);

    fireEvent.change(screen.getByLabelText("College email"), { target: { value: "student@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a long campus passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/onboarding"));
  });

  it("honors the separate administrator destination", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_admin" },
      next_step: "complete",
    });
    render(<AuthForm mode="sign-in" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("College email"), { target: { value: "admin@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a long campus passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/dashboard"));
  });

  it("routes an administrator into mandatory MFA setup", async () => {
    csrfRequestMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.edu", role: "tnp_admin" },
      next_step: "mfa_setup",
    });
    render(<AuthForm mode="sign-in" redirectTo="/admin/dashboard" />);
    fireEvent.change(screen.getByLabelText("College email"), { target: { value: "admin@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a secure passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/mfa/setup"));
  });
});
