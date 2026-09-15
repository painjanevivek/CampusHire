import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorialLanding } from "./editorial-landing";

describe("EditorialLanding", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.clear();
  });

  it("explains the placement journey without exposing private role search", () => {
    render(<EditorialLanding />);
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your next step, clearly in view/i })).toBeInTheDocument();
    expect(screen.queryByText(/private to verified members/i)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Product preview" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Docs" })[0]).toHaveAttribute("href", "/docs");
  });

  it("orders header access before registration and keeps the hero free of account buttons", () => {
    render(<EditorialLanding />);

    expect(screen.queryByRole("link", { name: "Student and institution verification" })).not.toBeInTheDocument();
    const headerActions = screen.getByLabelText("Account access");
    const headerLinks = Array.from(headerActions.querySelectorAll("a"));
    expect(headerLinks.map((link) => link.textContent)).toEqual(["Sign In", "Sign Up"]);
    expect(headerLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/sign-in",
      "/sign-up?from=/",
    ]);
    expect(document.querySelector("[data-hero-actions]")).not.toBeInTheDocument();
  });

  it("separates eligibility from match", () => {
    render(<EditorialLanding />);

    expect(screen.getByRole("heading", { name: "Eligibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Role match" })).toBeInTheDocument();
    expect(screen.getByText("A match score never decides whether you can apply.")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-reveal-group]")).toHaveLength(5);
  });

  it("places an accessible theme toggle before sign in and switches themes", () => {
    render(<EditorialLanding />);

    const toggle = screen.getByRole("button", { name: "Switch to light mode" });
    const signIn = screen.getByRole("link", { name: "Sign In" });

    expect(toggle.nextElementSibling).toBe(signIn);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    fireEvent.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(window.localStorage.getItem("campushire-theme")).toBe("light");
  });
});
