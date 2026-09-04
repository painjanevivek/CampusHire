import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("keeps authentication connected to the public CampusHire navigation", () => {
    render(
      <AuthShell eyebrow="Welcome" title="Sign in" description="Continue." footer="Footer">
        <form aria-label="Sign in form" />
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "CampusHire home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
  });

  it("shows placement-account principles for T&P access", () => {
    const { container } = render(
      <AuthShell context="admin" eyebrow="T&P workspace" title="Sign in" description="Continue." footer="Footer">
        <form aria-label="Administrator sign in form" />
      </AuthShell>,
    );

    expect(container.querySelector('[data-auth-context="admin"]')).toBeInTheDocument();
    expect(screen.getByText("Placement records stay accountable")).toBeInTheDocument();
    expect(screen.getByText(/Review decisions remain human/)).toBeInTheDocument();
  });
});
