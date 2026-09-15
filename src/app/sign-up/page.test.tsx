import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignUpPage from "./page";

vi.mock("@/features/auth/sign-up-form", () => ({
  SignUpForm: () => <form aria-label="Student sign-up form" />,
}));

describe("SignUpPage", () => {
  it("keeps public signup student-only and returns to its referring page", async () => {
    render(await SignUpPage({ searchParams: Promise.resolve({ from: "/docs" }) }));

    const form = screen.getByRole("form", { name: "Student sign-up form" });
    expect(form).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /choose sign-up account/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /training & placement/i })).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("authPage--centered");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByText("What comes next")).not.toBeInTheDocument();
    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/docs");
  });

  it("falls back to student sign in when no referring page is supplied", async () => {
    render(await SignUpPage({}));

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/sign-in");
  });
});
