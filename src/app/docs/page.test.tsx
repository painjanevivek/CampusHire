import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DocsPage from "./page";

describe("DocsPage", () => {
  it("explains the website for students and placement teams", () => {
    render(<DocsPage />);

    expect(screen.getByRole("heading", { name: "Understand CampusHire before you start." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From invitation to application." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tools for careful, consistent placement work." })).toBeInTheDocument();
    expect(screen.getByText("AI may help explain a match. It never makes the official eligibility decision.")).toBeInTheDocument();
  });

  it("links to the main public and sign-in routes", () => {
    render(<DocsPage />);

    expect(screen.getByRole("link", { name: "CampusHire home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Open Help center" })).toHaveAttribute("href", "/help");
    expect(screen.getByRole("link", { name: "Open T&P sign in" })).toHaveAttribute("href", "/tnp/sign-in");
  });

  it("keeps only Help in the Docs action navigation", () => {
    render(<DocsPage />);

    const actions = screen.getByRole("navigation", { name: "Docs actions" });
    expect(within(actions).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(within(actions).queryByRole("link", { name: "Student sign in" })).not.toBeInTheDocument();
    expect(within(actions).queryByRole("link", { name: "T&P access" })).not.toBeInTheDocument();
  });
});
