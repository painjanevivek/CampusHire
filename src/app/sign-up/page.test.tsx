import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignUpPage from "./page";

vi.mock("@/features/auth/sign-up-form", () => ({
  SignUpForm: () => <form aria-label="Student sign-up form" />,
}));

describe("SignUpPage", () => {
  it("centers the student form without the written follow-up panel", () => {
    render(<SignUpPage />);

    const form = screen.getByRole("form", { name: "Student sign-up form" });
    expect(form).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("authPage--centered");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByText("What comes next")).not.toBeInTheDocument();
    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
  });
});
