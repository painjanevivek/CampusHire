import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApplications } from "./admin-applications";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn(), csrfRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const application = {
  id: "application-1", role_id: "role-1", student_user_id: "student-123456", resume_version_id: "resume-1", status: "under_review",
  student_name: "Asha Patil", student_email: "asha@example.edu",
  role_snapshot: { title: "Software Engineer", company_name: "Nexora Labs" }, resume_snapshot: { version_number: 2, original_name: "resume-v2.pdf", checksum: "abc123456789000" },
  facts_snapshot: { degree: "B.Tech" }, rule_snapshot: { id: "rules-123456789", version: 1 },
  eligibility_snapshot: { status: "needs_manual_review", rule_set_id: "rules-1", rule_version: "1", results: [{ label: "Active backlogs", passed: null, reason: "Required profile data is missing" }], missing_evidence: ["Active backlogs"] },
  created_at: "2026-08-24T00:00:00Z", updated_at: "2026-08-24T00:00:00Z",
  history: [{ id: "event-1", from_status: null, to_status: "submitted", actor_user_id: "student-123456", reason: "Application submitted by student", created_at: "2026-08-24T00:00:00Z" }], overrides: [],
};

describe("AdminApplications", () => {
  beforeEach(() => {
    apiRequestMock.mockReset(); csrfRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({ items: [application], page: 1, page_size: 50, total: 1 });
  });

  it("requires reasoned overrides and keeps eligibility evidence visible", async () => {
    csrfRequestMock.mockResolvedValue({ ...application, status: "shortlisted", overrides: [{ id: "override-1" }] });
    render(<AdminApplications />);
    expect(await screen.findByText("Active backlogs")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Authorized override"));
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Policy permits reviewed equivalent evidence." } });
    fireEvent.change(screen.getByLabelText("Policy reference (optional)"), { target: { value: "Policy §4.2" } });
    fireEvent.click(screen.getByRole("button", { name: "Record override" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/admin/recruitment/applications/application-1/override", expect.objectContaining({ body: expect.stringContaining("Policy permits") })));
  });
});
