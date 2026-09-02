import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorialLanding } from "./editorial-landing";

describe("EditorialLanding", () => {
  it("explains the invitation-led journey without exposing private role search", () => {
    render(<EditorialLanding />);
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /accept your invitation/i })).toBeInTheDocument();
    expect(screen.getByText(/private to verified members/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Product preview" })).toBeInTheDocument();
  });

  it("keeps one profile action and separates eligibility from match", () => {
    render(<EditorialLanding />);

    expect(screen.getAllByRole("link", { name: "How invitations work" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Eligibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Role match" })).toBeInTheDocument();
    expect(screen.getByText("A match score never decides whether you can apply.")).toBeInTheDocument();
  });
});
