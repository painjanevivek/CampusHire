import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpportunityDetail } from "./opportunity-detail";

describe("OpportunityDetail", () => {
  it("presents rule eligibility before semantic match guidance", () => {
    render(<OpportunityDetail />);

    const eligibility = screen.getByRole("heading", { name: "Formally eligible" });
    const match = screen.getByRole("heading", { name: "92% match" });
    expect(eligibility.compareDocumentPosition(match) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/not a hiring probability/)).toBeInTheDocument();
  });

  it("matches the current Nexora demo opportunity", () => {
    render(<OpportunityDetail />);

    expect(screen.getByRole("heading", { name: "AI/ML Intern." })).toBeInTheDocument();
    expect(screen.getByText("Nexora Labs / internship program")).toBeInTheDocument();
    expect(screen.getByText(/Apply by 25 August 2026/)).toBeInTheDocument();
    expect(screen.getByText("rule-set: nexora-v1")).toBeInTheDocument();
  });

  it("labels the eligibility explanation independently from match guidance", () => {
    render(<OpportunityDetail />);

    expect(screen.getByRole("heading", { name: "Eligibility explained" })).toBeInTheDocument();
    expect(screen.getByText("Formal requirements are checked by published placement rules.")).toBeInTheDocument();
  });
});
