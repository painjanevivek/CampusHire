import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorialLanding } from "./editorial-landing";

describe("EditorialLanding", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.clear();
  });

  it("leads with the accountable campus-placement proposition", () => {
    render(<EditorialLanding />);

    const brand = screen.getByRole("link", { name: "CampusHire home" });
    expect(brand.closest("header")).toHaveAttribute("data-public-header");
    expect(brand.closest("header")).toHaveAttribute("data-landing-header");
    expect(screen.getByRole("heading", { name: /campus placement, with the proof in view/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create your profile" })).toHaveAttribute("href", "/sign-up?from=/");
    expect(screen.getByRole("link", { name: "See the placement record" })).toHaveAttribute("href", "#record");
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });

  it("uses checked-in product evidence instead of fabricated interface previews", () => {
    render(<EditorialLanding />);

    const preview = screen.getByRole("region", { name: "CampusHire product views" });
    expect(within(preview).getByRole("img", { name: /student readiness workspace/i })).toHaveAttribute(
      "src",
      expect.stringContaining("student-priorities"),
    );
    expect(within(preview).getByRole("img", { name: /placement team application review/i })).toHaveAttribute(
      "src",
      expect.stringContaining("placement-review"),
    );
    expect(preview).toHaveTextContent(/synthetic demonstration data/i);
  });

  it("shows the full placement record in order", () => {
    render(<EditorialLanding />);

    const record = screen.getByRole("region", { name: "The placement record" });
    const steps = within(record).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringMatching(/profile evidence/i),
      expect.stringMatching(/reviewed resume/i),
      expect.stringMatching(/published eligibility/i),
      expect.stringMatching(/application snapshot/i),
      expect.stringMatching(/human decision/i),
    ]);
  });

  it("keeps eligibility, role match, and human authority separate", () => {
    render(<EditorialLanding />);

    expect(screen.getByRole("heading", { name: "Eligibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Role match" })).toBeInTheDocument();
    expect(screen.getByText("A match score never decides whether you can apply.")).toBeInTheDocument();
    expect(screen.getByText(/official decisions stay with published rules and responsible people/i)).toBeInTheDocument();
  });

  it("routes students and placement teams to distinct entry points", () => {
    render(<EditorialLanding />);

    expect(screen.getByRole("link", { name: "Start a student profile" })).toHaveAttribute("href", "/sign-up?from=/");
    expect(screen.getByRole("link", { name: "Open student sign in" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Open T&P sign in" })).toHaveAttribute("href", "/tnp/sign-in");
    expect(screen.getByText(/accounts are issued by the institution/i)).toBeInTheDocument();
  });

  it("places an accessible theme toggle before sign in and switches themes", () => {
    render(<EditorialLanding />);

    const toggle = screen.getByRole("button", { name: "Switch to light mode" });
    const signIn = screen.getByRole("link", { name: "Sign in" });
    expect(toggle.nextElementSibling).toBe(signIn);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    fireEvent.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(window.localStorage.getItem("campushire-theme")).toBe("light");
  });
});
