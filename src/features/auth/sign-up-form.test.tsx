import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

const institutionId = "00000000-0000-0000-0000-000000000001";

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

async function completeForm(password = "a secure campus passphrase") {
  await waitFor(() => expect(screen.getByRole("option", { name: "Test College" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("College"), { target: { value: institutionId } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
  fireEvent.change(screen.getByLabelText("Surname"), { target: { value: "Patil" } });
  fireEvent.change(screen.getByLabelText("DOB"), { target: { value: "2004-05-16" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha@student-campus.edu" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Re-enter password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("SignUpForm", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([{ id: institutionId, name: "Test College" }]);
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("keeps student identity, email, college, password, and consent required without an invitation field", async () => {
    render(<SignUpForm />);

    await waitFor(() => expect(screen.getByRole("option", { name: "Test College" })).toBeInTheDocument());
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Surname")).toBeRequired();
    expect(screen.getByLabelText("DOB")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("College")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Re-enter password")).toBeRequired();
    expect(screen.queryByLabelText(/invitation code/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /invitation code/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews access before activation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/activate your account now/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("registers without an invitation code and continues to student onboarding", async () => {
    csrfRequestMock.mockResolvedValue({
      status: "registered",
      message: "Account created. Continue to your student profile.",
      next_path: "/onboarding",
    });
    render(<SignUpForm />);
    await completeForm();

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Asha",
        surname: "Patil",
        dob: "2004-05-16",
        email: "asha@student-campus.edu",
        institution_id: institutionId,
        password: "a secure campus passphrase",
        re_enter_password: "a secure campus passphrase",
        terms_version: "2026-08-28",
        privacy_version: "2026-08-28",
      }),
    }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/onboarding"));
  });

  it("does not submit when the passwords differ", async () => {
    render(<SignUpForm />);
    await completeForm();
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
