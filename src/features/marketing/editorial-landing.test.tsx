import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorialLanding } from "./editorial-landing";

describe("EditorialLanding", () => {
  it("leads students from profile creation to opportunities", () => {
    render(<EditorialLanding />);

    expect(
      screen.getByRole("heading", {
        name: "Build a placement story you can stand behind.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Create profile" })).toHaveLength(
      2,
    );
    for (const link of screen.getAllByRole("link", { name: "Create profile" })) {
      expect(link).toHaveAttribute("href", "/sign-up");
    }
    expect(
      screen.getByRole("link", { name: "Browse opportunities" }),
    ).toHaveAttribute("href", "/opportunities");
  });

  it("explains eligibility separately from role match", () => {
    render(<EditorialLanding />);

    expect(
      screen.getAllByRole("heading", { name: "Formal eligibility" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: "Role match" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("A match score never decides formal eligibility.")
        .length,
    ).toBeGreaterThan(0);
  });

  it("keeps explanations operable without hover", () => {
    render(<EditorialLanding />);

    const eligibility = screen.getByRole("button", {
      name: "Formal eligibility",
    });
    expect(eligibility).toHaveAttribute("aria-expanded", "true");

    const resume = screen.getByRole("button", {
      name: "Reviewed resume improvements",
    });
    fireEvent.click(resume);

    expect(resume).toHaveAttribute("aria-expanded", "true");
    expect(eligibility).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the principle carousel under explicit student control", () => {
    render(<EditorialLanding />);

    fireEvent.click(screen.getByRole("button", { name: "Next principle" }));

    expect(
      screen.getByRole("heading", { name: "Rules stay accountable" }),
    ).toBeInTheDocument();
  });

  it("preserves all content when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    try {
      render(<EditorialLanding />);
      expect(
        screen.getByRole("heading", {
          name: "Build a placement story you can stand behind.",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Next principle" }),
      ).toBeEnabled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
