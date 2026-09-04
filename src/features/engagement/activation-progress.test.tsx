import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivationProgress } from "./activation-progress";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  cachedApiRequest: apiRequestMock,
}));

const activation = [
  { key: "account_activated", label: "Account activated", status: "complete", href: "/profile", estimated_minutes: 1, unlocks: "Student workspace" },
  { key: "profile_minimum", label: "Profile minimum", status: "current", href: "/onboarding", estimated_minutes: 8, unlocks: "Eligibility checks" },
  { key: "target_role", label: "Target role", status: "upcoming", href: "/onboarding", estimated_minutes: 2, unlocks: "Curated roadmap" },
];

describe("ActivationProgress", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({ activation });
  });

  it("keeps progress compact and discloses the current step on demand", async () => {
    render(<ActivationProgress />);

    await waitFor(() => expect(screen.getByText("1/3")).toBeInTheDocument());
    const summary = screen.getByLabelText("Open activation checklist");
    fireEvent.click(summary);

    expect(await screen.findAllByText("Profile minimum")).toHaveLength(2);
    expect(screen.getByText("8 min · Unlocks eligibility checks")).toBeInTheDocument();
    expect(screen.getByLabelText("Close activation checklist")).toBeInTheDocument();
  });

  it("collapses completed activation into a clear status", async () => {
    apiRequestMock.mockResolvedValueOnce({
      activation: activation.map((item) => ({ ...item, status: "complete" })),
    });
    render(<ActivationProgress />);

    expect(await screen.findByText("Activated")).toBeInTheDocument();
  });
});
