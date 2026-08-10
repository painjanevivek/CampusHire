import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  StudentDashboard,
  type StudentDashboardData,
} from "./student-dashboard";

const readyDashboard: StudentDashboardData = {
  studentName: "Aarav",
  readiness: 83,
  state: "ready",
  nextAction: {
    title: "Add deployment evidence",
    description: "Publish one working project and attach its live link.",
    reason: "A verified deployment is the clearest gap for your target role.",
    href: "/roadmap",
  },
  evidence: [
    { label: "Education", value: "Verified", status: "verified" },
    { label: "Skills", value: "Reviewed", status: "verified" },
    { label: "Deployment", value: "Missing", status: "pending" },
  ],
  opportunities: [
    {
      company: "Northstar Labs",
      role: "AI Platform Intern",
      location: "Bengaluru · Hybrid",
      eligibility: "Formally eligible",
      match: 92,
      href: "/opportunities/ai-platform-intern",
    },
  ],
};

describe("StudentDashboard", () => {
  it("prioritizes one explained readiness action before eligible opportunities", () => {
    render(<StudentDashboard data={readyDashboard} />);

    expect(screen.getByRole("region", { name: "Next readiness action" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add deployment evidence" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Why this next?")).toBeInTheDocument();
    const readiness = screen.getByRole("progressbar", { name: "Profile readiness score" });
    expect(readiness).toHaveAttribute(
      "aria-valuenow",
      "83",
    );
    expect(readiness.tagName).toBe("svg");

    const opportunity = screen.getByRole("article", {
      name: "AI Platform Intern at Northstar Labs",
    });
    expect(opportunity).toHaveTextContent("Formally eligible");
    expect(opportunity).toHaveTextContent("92% match");
    expect(
      screen.getByText("Match is decision support, not hiring probability."),
    ).toBeInTheDocument();
  });

  it("does not turn unavailable match guidance into an eligibility decision", () => {
    render(<StudentDashboard data={{ ...readyDashboard, state: "ai-unavailable" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Check unavailable");
    expect(screen.getByRole("article", { name: "AI Platform Intern at Northstar Labs" })).toHaveTextContent("Formally eligible");
  });

  it.each([
    ["incomplete", "Finish your profile to unlock eligibility checks."],
    ["processing", "We’re checking your evidence now."],
    ["manual-review", "A reviewer is checking your evidence."],
    ["ai-unavailable", "Match explanations are temporarily unavailable."],
    ["error", "We couldn’t load your readiness."],
  ] as const)("explains the %s state", (state, message) => {
    render(<StudentDashboard data={{ ...readyDashboard, state }} />);

    expect(screen.getByRole("status")).toHaveTextContent(message);
  });

  it("gives an actionable empty-opportunities state", () => {
    render(
      <StudentDashboard data={{ ...readyDashboard, opportunities: [] }} />,
    );

    expect(screen.getByText("No eligible opportunities yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Improve my evidence" }),
    ).toHaveAttribute("href", "/roadmap");
  });
});
