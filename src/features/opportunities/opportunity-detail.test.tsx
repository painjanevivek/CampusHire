import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpportunityDetail } from "./opportunity-detail";

describe("OpportunityDetail", () => {
  it("presents rule eligibility before semantic match guidance", () => {
    render(<OpportunityDetail />);

    const eligibility = screen.getByRole("heading", { name: "Formally eligible" });
    const match = screen.getByRole("heading", { name: "84% match" });
    expect(eligibility.compareDocumentPosition(match) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/not a hiring probability/)).toBeInTheDocument();
  });
});
