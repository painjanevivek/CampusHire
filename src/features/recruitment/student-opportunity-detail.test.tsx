import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { StudentOpportunityDetail } from "./student-opportunity-detail";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const role = {
  id: "role-1",
  drive_id: "drive-1",
  company_name: "Nexora Labs",
  drive_title: "Graduate engineering",
  title: "Software Engineer",
  description: "Build reliable product systems.",
  employment_type: "full-time",
  location: "Bengaluru, India",
  work_mode: "hybrid",
  salary_display: null,
  skills: ["Python"],
  requirements: ["B.Tech"],
  status: "published",
  published_at: "2026-08-20T00:00:00Z",
  deadline_at: "2027-08-30T00:00:00Z",
  eligibility: {
    status: "eligible",
    rule_set_id: "rules-1",
    rule_version: "1",
    results: [{ label: "Degree", passed: true, reason: "Requirement met" }],
    missing_evidence: [],
  },
  saved: false,
  application_id: null,
  application_status: null,
};

const semanticMatch = {
  status: "available",
  score: 84,
  components: { skill_coverage: 0.8 },
  explanation: [
    "80% of published role skills are represented.",
    "This score never changes your rule-based eligibility.",
  ],
  embedding_model: "gemini-embedding-001",
  embedding_version: "v1",
  scoring_version: "match-v1",
  source_resume_version_id: "resume-1",
  source_profile_revision: 3,
  safe_error_code: null,
  evaluated_at: "2026-08-24T00:00:00Z",
};

describe("StudentOpportunityDetail", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/resumes")
        return Promise.resolve([
          {
            id: "resume-1",
            version_number: 2,
            original_name: "resume-v2.pdf",
            status: "completed",
            scan_status: "clean",
          },
        ]);
      return Promise.resolve(role);
    });
    csrfRequestMock.mockImplementation((path: string) =>
      Promise.resolve(path.endsWith("/match") ? semanticMatch : {
        id: "application-1",
        status: "submitted",
      }),
    );
  });

  it("keeps deterministic role details available when semantic matching fails", async () => {
    csrfRequestMock.mockImplementation((path: string) =>
      path.endsWith("/match")
        ? Promise.reject(new ApiError(503, "Matching unavailable", "match_unavailable"))
        : Promise.resolve({ id: "application-1", status: "submitted" }),
    );

    render(<StudentOpportunityDetail roleId="role-1" />);

    expect(await screen.findByRole("heading", { name: "Software Engineer" }))
      .toBeInTheDocument();
    expect(screen.getByText("Why you are eligible")).toBeInTheDocument();
    expect(screen.getByText(/Skills matching is unavailable/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build application packet" })).toHaveAttribute(
      "href",
      "/opportunities/role-1/apply",
    );
  });

  it("uses the packet wizard as the sole application path", async () => {
    render(<StudentOpportunityDetail roleId="role-1" />);
    const link = await screen.findByRole("link", { name: "Build application packet" });
    expect(link).toHaveAttribute("href", "/opportunities/role-1/apply");
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/opportunities/role-1/match",
        { method: "POST" },
      ),
    );
    expect(csrfRequestMock).not.toHaveBeenCalledWith(
      "/applications",
      expect.anything(),
    );
    expect(screen.getByLabelText("84 percent advisory role fit")).toHaveTextContent("84%");
    expect(
      screen.getByText("This score never changes your rule-based eligibility."),
    ).toBeInTheDocument();
  });

});
