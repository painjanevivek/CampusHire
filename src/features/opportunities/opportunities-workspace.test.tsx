import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpportunitiesWorkspace } from "./opportunities-workspace";

describe("OpportunitiesWorkspace", () => {
  it("filters roles and restores the complete list", () => {
    render(<OpportunitiesWorkspace />);

    expect(screen.getByRole("article", { name: "AI/ML Intern at Nexora Labs" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Frontend Developer at Contour Software" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search opportunities" }), {
      target: { value: "React" },
    });

    expect(screen.queryByRole("article", { name: "AI/ML Intern at Nexora Labs" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Frontend Developer at Contour Software" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("article", { name: "AI/ML Intern at Nexora Labs" })).toBeInTheDocument();
  });

  it("keeps eligibility before decision-support match guidance", () => {
    render(<OpportunitiesWorkspace />);

    const eligibility = screen.getAllByText("Formally eligible")[0];
    const match = screen.getAllByText("92% match")[0];

    expect(eligibility.compareDocumentPosition(match) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Match is decision support, not hiring probability.")).toBeInTheDocument();
  });

  it("offers a useful recovery when filters return no eligible roles", () => {
    render(<OpportunitiesWorkspace />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search opportunities" }), {
      target: { value: "astronaut" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("No eligible roles match");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeEnabled();
  });
});
