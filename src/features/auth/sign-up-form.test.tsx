import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

const { csrfRequestMock, pushMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

function completeForm(password = "a secure campus passphrase") {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
  fireEvent.change(screen.getByLabelText("Surname"), { target: { value: "Patil" } });
  fireEvent.change(screen.getByLabelText("DOB"), { target: { value: "2004-05-16" } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "asha@student-campus.edu" },
  });
  fireEvent.change(screen.getByLabelText("Invitation code (optional)"), {
    target: { value: "approved-roster-invitation-code" },
  });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Re-enter password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("SignUpForm", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("makes the invitation code optional while keeping student details required", () => {
    render(<SignUpForm />);

    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Surname")).toBeRequired();
    expect(screen.getByLabelText("DOB")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Invitation code (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Re-enter password")).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByText(/placement office/i)).toBeInTheDocument();
    expect(screen.queryByText("T&P")).not.toBeInTheDocument();
  });

  it("submits without an invitation code as an access request, not a signed-in account", async () => {
    csrfRequestMock.mockResolvedValue({
      status: "approval_pending",
      message: "Your request was recorded for placement-office review.",
      next_path: null,
    });
    render(<SignUpForm />);
    completeForm();
    fireEvent.change(screen.getByLabelText("Invitation code (optional)"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalled());
    expect(JSON.parse(csrfRequestMock.mock.calls[0][1].body)).toMatchObject({
      email: "asha@student-campus.edu",
      invitation_code: null,
    });
    expect(await screen.findByText("Your request was recorded for placement-office review.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("submits the complete student registration payload", async () => {
    csrfRequestMock.mockResolvedValue({
      status: "registered",
      message: "Account created. Continue to your student profile.",
      next_path: "/onboarding",
    });
    render(<SignUpForm />);
    completeForm();

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: "Asha",
          surname: "Patil",
          dob: "2004-05-16",
          email: "asha@student-campus.edu",
          invitation_code: "approved-roster-invitation-code",
          password: "a secure campus passphrase",
          re_enter_password: "a secure campus passphrase",
          terms_version: "2026-08-28",
          privacy_version: "2026-08-28",
        }),
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/onboarding"));
    expect(screen.queryByText(/activation link/i)).not.toBeInTheDocument();
  });

  it("does not submit when the passwords differ", () => {
    render(<SignUpForm />);
    completeForm();
    fireEvent.change(screen.getByLabelText("Re-enter password"), {
      target: { value: "a different campus passphrase" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(csrfRequestMock).not.toHaveBeenCalled();
  });

  it("toggles each sign-up password independently without changing its value", () => {
    render(<SignUpForm />);
    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Re-enter password");
    fireEvent.change(password, { target: { value: "a secure campus passphrase" } });
    fireEvent.change(confirmation, { target: { value: "a secure campus passphrase" } });

    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "password");
    const showButtons = screen.getAllByRole("button", { name: "Show password" });
    expect(showButtons).toHaveLength(2);
    fireEvent.click(showButtons[0]);
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");
    fireEvent.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(confirmation).toHaveAttribute("type", "text");
    expect(password).toHaveValue("a secure campus passphrase");
    expect(confirmation).toHaveValue("a secure campus passphrase");
  });
});
