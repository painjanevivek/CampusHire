import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { StudentApplicationDetail } from "./student-application-detail";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
  apiPath: (path: string) => `https://api.example.test${path}`,
}));

const application = {
  id: "application-1",
  role_id: "role-1",
  student_user_id: "student-1",
  student_name: "Asha",
  student_email: "asha@example.edu",
  resume_version_id: "resume-1",
  status: "submitted",
  role_snapshot: {
    title: "Software Engineer",
    company_name: "Nexora Labs",
    deadline_at: "2026-09-18T10:00:00Z",
  },
  resume_snapshot: { version_number: 2, original_name: "asha-resume.pdf" },
  facts_snapshot: {},
  rule_snapshot: {
    version: 3,
    policy_references: [{ title: "Placement eligibility policy", version: 2 }],
  },
  eligibility_snapshot: {},
  decision_snapshot: { eligibility_fingerprint: "1234567890abcdef" },
  institution_timezone: "Asia/Kolkata",
  created_at: "2026-08-28T10:00:00Z",
  updated_at: "2026-08-28T10:00:00Z",
  withdrawn_at: null,
  withdrawal_reason: null,
  can_withdraw: true,
  history: [{ id: "event-1", from_status: null, to_status: "submitted", actor_user_id: "student-1", reason: "Application submitted by student", created_at: "2026-08-28T10:00:00Z" }],
  overrides: [],
  appeals: [],
};

describe("StudentApplicationDetail", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    apiRequestMock.mockReset().mockResolvedValue(application);
    csrfRequestMock.mockReset().mockResolvedValue({ ...application, status: "withdrawn", can_withdraw: false });
  });

  it("shows the evidence attached to a review request", async () => {
    apiRequestMock.mockResolvedValue({
      ...application,
      appeals: [{
        id: "appeal-1",
        kind: "manual_review",
        status: "under_review",
        reason: "Please review the verified academic record attached to this request.",
        supporting_evidence: ["Semester 6 transcript", "Reviewed resume version 2"],
        administrator_response: null,
        created_at: "2026-08-29T10:00:00Z",
        updated_at: "2026-08-29T10:00:00Z",
        resolved_at: null,
      }],
    });

    render(<StudentApplicationDetail applicationId="application-1" />);
    expect(await screen.findByText("Semester 6 transcript")).toBeInTheDocument();
    expect(screen.getByText("Reviewed resume version 2")).toBeInTheDocument();
  });

  it("removes terminal action controls after withdrawal", async () => {
    apiRequestMock.mockResolvedValue({
      ...application,
      status: "withdrawn",
      can_withdraw: false,
      withdrawn_at: "2026-08-29T10:00:00Z",
    });

    render(<StudentApplicationDetail applicationId="application-1" />);
    await screen.findByRole("heading", { name: "Software Engineer" });
    expect(screen.queryByRole("region", { name: "Application actions" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Withdraw application")).not.toBeInTheDocument();
  });

  it("reuses the same appeal key after an unknown outcome", async () => {
    csrfRequestMock
      .mockRejectedValueOnce(new ApiError(0, "Timed out", "request_timeout", undefined, undefined, "timeout"))
      .mockResolvedValueOnce({ id: "appeal-1" });

    render(<StudentApplicationDetail applicationId="application-1" />);
    await screen.findByRole("heading", { name: "Software Engineer" });
    fireEvent.click(screen.getByText("Request an appeal or manual review"));
    fireEvent.change(screen.getAllByLabelText("Reason")[1], {
      target: { value: "Please review the verified education evidence attached to my record." },
    });
    fireEvent.change(screen.getByLabelText("Supporting details (optional)"), {
      target: { value: "Semester 6 transcript" },
    });
    fireEvent.click(screen.getByLabelText(/I confirm this request is accurate/i));
    fireEvent.click(screen.getByRole("button", { name: "Submit review request" }));
    expect(await screen.findByText(/could not confirm the request outcome/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit review request" }));
    expect(await screen.findByText(/review request was submitted/i)).toBeInTheDocument();
    const requests = csrfRequestMock.mock.calls.filter((call) =>
      call[0] === "/applications/application-1/appeals");
    expect(requests).toHaveLength(2);
    expect(requests[1][1].headers["Idempotency-Key"])
      .toBe(requests[0][1].headers["Idempotency-Key"]);
  });

  it("shows locked application details, history, and a calendar download", async () => {
    render(<StudentApplicationDetail applicationId="application-1" />);
    expect(await screen.findByRole("heading", { name: "Software Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    expect(screen.getByText("Rule v3")).toBeInTheDocument();
    expect(screen.getByText(/Placement eligibility policy v2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download calendar file" })).toHaveAttribute(
      "href",
      "https://api.example.test/applications/application-1/deadline.ics",
    );
  });

  it("requires explicit withdrawal confirmation before sending the final action", async () => {
    render(<StudentApplicationDetail applicationId="application-1" />);
    await screen.findByRole("heading", { name: "Software Engineer" });
    fireEvent.click(screen.getByText("Withdraw application"));
    fireEvent.change(screen.getAllByLabelText("Reason")[0], {
      target: { value: "I accepted another placement opportunity." },
    });
    fireEvent.click(screen.getByLabelText(/I understand this withdrawal is final/i));
    fireEvent.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/applications/application-1/withdraw",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
