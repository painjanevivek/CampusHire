import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyControls } from "./privacy-controls";

describe("PrivacyControls", () => {
  it("does not expose student data deletion controls", () => {
    render(<PrivacyControls />);

    expect(screen.getByRole("heading", { name: "Your placement data has a defined purpose." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Essential cookies, without tracking." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete eligible data/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/DELETE MY CAMPUSHIRE DATA/)).not.toBeInTheDocument();
  });
});
