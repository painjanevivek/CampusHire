import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlacementAccessUnavailable } from "./placement-access-unavailable";

describe("PlacementAccessUnavailable", () => {
  it("explains the year rule and pending institution verification", () => {
    render(<PlacementAccessUnavailable studyYear={2} verificationRequired />);

    expect(screen.getByRole("heading", { name: "Placement Access Currently Unavailable" })).toBeInTheDocument();
    expect(screen.getByText("Current academic year: 2nd Year")).toBeInTheDocument();
    expect(screen.getByText(/awaiting verification by the institution placement office/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review your profile" })).toHaveAttribute("href", "/profile");
  });
});
