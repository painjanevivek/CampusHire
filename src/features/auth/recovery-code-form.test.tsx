import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecoveryCodeForm } from "./recovery-code-form";

vi.mock("./password-reset-form", () => ({
  PasswordResetForm: ({ token }: { token: string }) => <p>Reset with {token}</p>,
}));

describe("RecoveryCodeForm", () => {
  it("accepts a one-time handoff without putting the code in the URL", () => {
    render(<RecoveryCodeForm />);
    fireEvent.change(screen.getByRole("textbox", { name: "One-time recovery code" }), {
      target: { value: "synthetic-one-time-recovery-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Reset with synthetic-one-time-recovery-code")).toBeInTheDocument();
  });
});
