import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResumeBuilder } from "./resume-builder";

describe("ResumeBuilder", () => {
  it("keeps suggestions student-controlled", () => {
    render(<ResumeBuilder />);

    expect(screen.getByText("Worked on a placement project.")).toBeInTheDocument();
    expect(screen.getByText(/separates eligibility rules/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit suggestion" }));
    expect(screen.getByRole("textbox", { name: "Edit proposed resume language" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Accept suggestion" }));
    expect(screen.getByRole("status")).toHaveTextContent("Suggestion accepted");
  });
});
