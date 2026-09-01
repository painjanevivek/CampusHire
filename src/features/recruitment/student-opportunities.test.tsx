import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentOpportunities } from "./student-opportunities";

const { apiRequestMock, csrfRequestMock, replaceMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const opportunity = {
  id: "role-1",
  drive_id: "drive-1",
  company_name: "Nexora Labs",
  drive_title: "Graduate engineering",
  title: "Software Engineer",
  description: "Build reliable product systems.",
  employment_type: "full-time",
  location: "Bengaluru, India",
  work_mode: "hybrid",
  salary_display: "INR 8–10 LPA",
  skills: ["Python", "SQL"],
  requirements: ["B.Tech"],
  status: "published",
  published_at: "2026-08-20T00:00:00Z",
  deadline_at: "2027-08-30T00:00:00Z",
  eligibility: { status: "eligible", rule_set_id: "rules-1", rule_version: "1", results: [], missing_evidence: [] },
  saved: false,
  application_id: null,
  application_status: null,
};

describe("StudentOpportunities", () => {
  beforeEach(() => {
    apiRequestMock.mockReset(); csrfRequestMock.mockReset(); replaceMock.mockReset();
    apiRequestMock.mockResolvedValue({ items: [opportunity], page: 1, page_size: 20, total: 1 });
  });

  it("keeps rule-based eligibility separate from skills match", async () => {
    render(<StudentOpportunities />);
    expect(await screen.findByRole("heading", { name: "Software Engineer" })).toBeInTheDocument();
    expect(screen.getAllByText("Eligible")).toHaveLength(2);
    expect(screen.getByText("Separate · not calculated in this phase")).toBeInTheDocument();
    expect(screen.queryByText(/% match/i)).not.toBeInTheDocument();
  });

  it("persists saved-role state through the API", async () => {
    csrfRequestMock.mockResolvedValue({ role_id: "role-1", saved: true });
    render(<StudentOpportunities />);
    const save = await screen.findByRole("button", { name: "Save Software Engineer" });
    fireEvent.click(save);
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/opportunities/role-1/save", { method: "POST" }));
    expect(screen.getByRole("button", { name: "Remove Software Engineer from saved roles" })).toBeInTheDocument();
  });
});
