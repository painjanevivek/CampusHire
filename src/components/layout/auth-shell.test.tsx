import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("keeps authentication connected to the public CampusHire navigation", () => {
    render(
      <AuthShell
        backHref="/"
        backLabel="Back to home"
        eyebrow="Welcome"
        title="Sign in"
        description="Continue."
        footer="Footer"
      >
        <form aria-label="Sign in form" />
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "CampusHire home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("keeps T&P authentication focused on the form", () => {
    const { container } = render(
      <AuthShell context="admin" eyebrow="T&P workspace" title="Sign in" description="Continue." footer="Footer">
        <form aria-label="Administrator sign in form" />
      </AuthShell>,
    );

    expect(container.querySelector('[data-auth-context="admin"]')).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("authPage--centered");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});
