import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentRoadmap } from "./student-roadmap";

describe("StudentRoadmap", () => {
  it("labels confirmed, next, and later milestones with one next action", () => {
    render(<StudentRoadmap />);

    expect(screen.getByRole("heading", { name: "Career roadmap" })).toBeInTheDocument();

    expect(screen.getAllByText("Confirmed")).toHaveLength(2);
    expect(screen.getByText("Next best move")).toBeInTheDocument();
    expect(screen.getAllByText("Later")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Open milestone" })).toHaveLength(1);
  });
});
