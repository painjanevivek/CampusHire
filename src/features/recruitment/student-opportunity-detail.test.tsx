import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentOpportunityDetail } from "./student-opportunity-detail";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn(), csrfRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const role = {
  id: "role-1", drive_id: "drive-1", company_name: "Nexora Labs", drive_title: "Graduate engineering",
  title: "Software Engineer", description: "Build reliable product systems.", employment_type: "full-time",
  location: "Bengaluru, India", work_mode: "hybrid", salary_display: null, skills: ["Python"], requirements: ["B.Tech"],
  status: "published", published_at: "2026-08-20T00:00:00Z", deadline_at: "2027-08-30T00:00:00Z",
  eligibility: { status: "eligible", rule_set_id: "rules-1", rule_version: "1", results: [{ label: "Degree", passed: true, reason: "Requirement met" }], missing_evidence: [] },
  saved: false, application_id: null, application_status: null,
};

describe("StudentOpportunityDetail", () => {
  beforeEach(() => {
    apiRequestMock.mockReset(); csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => path === "/resumes" ? Promise.resolve([{ id: "resume-1", version_number: 2, original_name: "resume-v2.pdf", status: "completed", scan_status: "clean" }]) : Promise.resolve(role));
  });

  it("confirms and submits an immutable application snapshot", async () => {
    csrfRequestMock.mockResolvedValue({ id: "application-1", status: "submitted" });
    render(<StudentOpportunityDetail roleId="role-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review application" }));
    expect(screen.getByText("CampusHire will preserve this resume, profile facts, rule version, and eligibility explanation.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/applications", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }) })));
    expect((await screen.findAllByText(/Application submitted/)).length).toBeGreaterThan(0);
  });
});
