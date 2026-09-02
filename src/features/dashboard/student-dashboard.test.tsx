import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  StudentDashboard,
  type StudentDashboardData,
} from "./student-dashboard";

const readyDashboard: StudentDashboardData = {
  studentName: "Aarav",
  readiness: { policy_version: "readiness-v2", completed_evidence: 3, total_evidence: 4, required_complete: true },
  state: "ready",
  nextAction: {
    title: "Add deployment evidence",
    description: "Publish one working project and attach its live link.",
    reason: "A verified deployment is the clearest gap for your target role.",
    href: "/roadmap",
    estimated_minutes: 15,
    unlocks: "Verified project evidence",
    completion_criteria: "A live deployment link is saved and verified.",
    policy_version: "readiness-v2",
    source_facts: ["reviewed_resume:available", "roadmap:deployment_pending"],
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
      eligibility: "Eligible",
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
    expect(screen.getByText("15 minutes")).toBeInTheDocument();
    expect(screen.getByText("A live deployment link is saved and verified.")).toBeInTheDocument();
    expect(screen.getByText("Unlocks verified project evidence")).toBeInTheDocument();
    expect(screen.getByText("3 of 4")).toBeInTheDocument();
    expect(screen.getByText("Readiness policy readiness-v2")).toBeInTheDocument();
    expect(screen.getByText("Evidence behind this action")).toBeInTheDocument();

    const opportunity = screen.getByRole("article", {
      name: "AI Platform Intern at Northstar Labs",
    });
    expect(opportunity).toHaveTextContent("Eligible");
    expect(opportunity).toHaveTextContent("92% match");
    expect(
      screen.getByText("Match is decision support, not hiring probability."),
    ).toBeInTheDocument();
  });

  it("does not turn unavailable match guidance into an eligibility decision", () => {
    render(<StudentDashboard data={{ ...readyDashboard, state: "ai-unavailable" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Check unavailable");
    expect(screen.getByRole("article", { name: "AI Platform Intern at Northstar Labs" })).toHaveTextContent("Eligible");
  });

  it.each([
    ["incomplete", "Finish your profile to unlock eligibility checks."],
    ["processing", "We’re checking your profile details now."],
    ["manual-review", "A reviewer is checking your information."],
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
      screen.getByRole("link", { name: "Improve my profile" }),
    ).toHaveAttribute("href", "/roadmap");
  });
});
