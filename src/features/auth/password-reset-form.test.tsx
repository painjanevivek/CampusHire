import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordResetForm } from "./password-reset-form";

const { csrfRequestMock } = vi.hoisted(() => ({ csrfRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", () => ({
  csrfRequest: csrfRequestMock,
  ApiError: class ApiError extends Error {},
}));

describe("PasswordResetForm", () => {
  beforeEach(() => csrfRequestMock.mockReset());

  it("shows the truthful email-disabled recovery instruction returned by the API", async () => {
    csrfRequestMock.mockResolvedValue({ message: "Email is not configured. Contact your placement office; no email was sent." });
    render(<PasswordResetForm />);
    fireEvent.change(screen.getByRole("textbox", { name: "Account email" }), {
      target: { value: "student@example.edu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request account recovery" }));
    expect(await screen.findByText("Email is not configured. Contact your placement office; no email was sent.")).toBeInTheDocument();
  });
});
