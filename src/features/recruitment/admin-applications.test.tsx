import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApplications } from "./admin-applications";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const application = {
  id: "application-1",
  role_id: "role-1",
  student_user_id: "student-123456",
  resume_version_id: "resume-1",
  status: "under_review",
  student_name: "Asha Patil",
  student_email: "asha@example.edu",
  role_snapshot: { title: "Software Engineer", company_name: "Nexora Labs" },
  resume_snapshot: {
    version_number: 2,
    original_name: "resume-v2.pdf",
    checksum: "abc123456789000",
  },
  facts_snapshot: { degree: "B.Tech" },
  rule_snapshot: { id: "rules-123456789", version: 1 },
  eligibility_snapshot: {
    status: "needs_manual_review",
    rule_set_id: "rules-1",
    rule_version: "1",
    results: [
      {
        label: "Active backlogs",
        passed: null,
        reason: "Required profile data is missing",
      },
    ],
    missing_evidence: ["Active backlogs"],
  },
  institution_timezone: "Asia/Kolkata",
  created_at: "2026-08-24T00:00:00Z",
  updated_at: "2026-08-24T00:00:00Z",
  history: [
    {
      id: "event-1",
      from_status: null,
      to_status: "submitted",
      actor_user_id: "student-123456",
      reason: "Application submitted by student",
      created_at: "2026-08-24T00:00:00Z",
    },
  ],
  overrides: [],
};

describe("AdminApplications", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({
      items: [application],
      page: 1,
      page_size: 50,
      total: 1,
    });
  });

  it("requires reasoned overrides and keeps eligibility checks visible", async () => {
    csrfRequestMock.mockResolvedValue({
      ...application,
      status: "shortlisted",
      overrides: [{ id: "override-1" }],
    });
    render(<AdminApplications />);
    expect(await screen.findByText("Active backlogs")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Authorized override"));
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Policy permits a reviewed equivalent record." },
    });
    fireEvent.change(screen.getByLabelText("Policy reference (optional)"), {
      target: { value: "Policy §4.2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record override" }));
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/admin/recruitment/applications/application-1/override",
        expect.objectContaining({
          body: expect.stringContaining("Policy permits"),
        }),
      ),
    );
  });

  it("publishes constructive feedback through a deduplicated internal update", async () => {
    csrfRequestMock.mockResolvedValue({ id: "notice-1" });
    render(<AdminApplications />);
    expect(await screen.findByText("Active backlogs")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Publish student feedback"));
    fireEvent.change(screen.getByLabelText("Update title"), {
      target: { value: "Next interview step" },
    });
    fireEvent.change(screen.getByPlaceholderText("Explain the decision and one useful next action."), {
      target: {
        value:
          "Review the role requirements and prepare one project explanation.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish update" }));
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/admin/notifications",
        expect.objectContaining({
          body: expect.stringContaining("feedback:application-1:under_review"),
        }),
      ),
    );
    const payload = JSON.parse(csrfRequestMock.mock.calls.at(-1)?.[1].body as string);
    expect(payload.deep_link).toBe("/applications/application-1");
  });

  it("previews bulk transitions before applying and reports notification outcomes", async () => {
    csrfRequestMock
      .mockResolvedValueOnce({
        items: [{ application_id: "application-1", current_status: "under_review", target_status: "shortlisted", allowed: true, explanation: "Transition follows the documented application lifecycle." }],
        allowed_count: 1,
        blocked_count: 0,
      })
      .mockResolvedValueOnce({ updated_count: 1, notification_count: 1, application_ids: ["application-1"] });
    render(<AdminApplications />);
    expect(await screen.findByText("Active backlogs")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Bulk review with preview"));
    const applications = screen.getByRole("listbox") as HTMLSelectElement;
    applications.options[0].selected = true;
    fireEvent.change(applications);
    fireEvent.change(screen.getByLabelText("Target status"), { target: { value: "shortlisted" } });
    fireEvent.change(screen.getByPlaceholderText("Explain the decision and give the student a useful next step."), { target: { value: "The details were reviewed against the published policy." } });
    fireEvent.click(screen.getByRole("button", { name: "Preview changes" }));
    expect(await screen.findByText("1 allowed · 0 blocked")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm and notify students" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/admin/recruitment/applications/bulk/status",
      expect.objectContaining({ body: expect.stringContaining("APPLY BULK STATUS") }),
    ));
    expect(await screen.findByText("1 applications updated; 1 students notified.")).toBeInTheDocument();
  });
});
