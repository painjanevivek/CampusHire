import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectedStudentDashboard } from "./connected-student-dashboard";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
}));

describe("ConnectedStudentDashboard", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({
      student_name: "Asha",
      readiness: { policy_version: "readiness-v1", completed_evidence: 3, total_evidence: 4, required_complete: true },
      state: "ready",
      next_action: {
        key: "roadmap",
        title: "Complete Python foundations",
        description: "Attach one tested project.",
        reason: "It is the first prerequisite-ready milestone.",
        href: "/roadmap",
        policy_version: "readiness-v1",
        source_facts: ["roadmap:v1"],
        estimated_minutes: 20,
        unlocks: "The next roadmap milestone",
        completion_criteria: "Attach one tested project.",
      },
      evidence: [
        { label: "Reviewed resume", value: "Available", status: "verified" },
      ],
      opportunities: [],
      roadmap: null,
      unread_notifications: 0,
    });
  });

  it("renders the single API-selected next action before opportunities", async () => {
    render(<ConnectedStudentDashboard />);
    expect(
      await screen.findByRole("heading", {
        name: "Complete Python foundations",
      }),
    ).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith("/dashboard", {
      cache: "no-store",
    });
  });

  it("keeps a page heading while the dashboard API is unavailable", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("offline"));
    render(<ConnectedStudentDashboard />);

    expect(
      screen.getByRole("heading", { name: "Your readiness workspace", level: 1 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/could not be refreshed/i),
    ).toBeInTheDocument();
  });
});
