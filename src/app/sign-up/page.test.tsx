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
    expect(screen.getByRole("link", { name: "Go back" })).toHaveAttribute("href", "/docs");
  });

  it("uses home as the fallback back target without duplicating the sign-in link", async () => {
    render(await SignUpPage({}));

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(1);
  });
});
