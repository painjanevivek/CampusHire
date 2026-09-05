import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApplications } from "./admin-applications";

const { apiRequestMock, csrfRequestMock, navigation } = vi.hoisted(() => ({
  navigation: { query: "", push: vi.fn(), replace: vi.fn() },
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const application = {
  revision: 3,
  allowed_actions: ["shortlisted", "rejected"],
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

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(navigation.query), useRouter: () => ({ push: navigation.push, replace: navigation.replace }) }));
vi.mock("@/features/experience/correction-panel", () => ({ CorrectionPanel: () => null }));

const row = { id: application.id, student_name: application.student_name, role_title: "Software Engineer", company_name: "Nexora Labs", status: "under_review", revision: 3, open_requests: 0, awaiting_review: 0 };
describe("AdminApplications", () => {
  beforeEach(() => {
    navigation.query = "selected=application-1"; window.history.replaceState(null, "", "/admin/applications?selected=application-1");
    navigation.push.mockReset(); navigation.replace.mockReset(); csrfRequestMock.mockReset();
    apiRequestMock.mockReset().mockImplementation((path: string) => Promise.resolve(path.includes("/review-queue/") ? application : { items: [row], total: 51, page: 1 }));
  });
  it("starts with a compact table and does not fetch evidence until a row is opened", async () => {
    navigation.query = "";
    window.history.replaceState(null, "", "/admin/applications");
    render(<AdminApplications />);
    const table = await screen.findByRole("table", { name: "Applications" });
    expect(within(table).getByRole("columnheader", { name: "Candidate" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Next action" })).toBeInTheDocument();
    await screen.findByRole("button", { name: /Review Asha Patil/ });
    expect(apiRequestMock.mock.calls.some(([path]) => path === "/admin/recruitment/review-queue/application-1")).toBe(false);
    expect(screen.queryByRole("region", { name: "Candidate decision details" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Review Asha Patil/ }));
    expect(navigation.push).toHaveBeenCalledWith("/admin/applications?selected=application-1", { scroll: false });
  });
  it("selects only the loaded page and clears a pending bulk preview when selection changes", async () => {
    render(<AdminApplications />);
    await screen.findByText(/Active backlogs/);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select this page" }));
    expect(screen.getByRole("checkbox", { name: "Select Asha Patil for bulk review" })).toBeChecked();
    expect(screen.getByRole("region", { name: "Selection toolbar" })).toHaveTextContent("1 selected on this page");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select this page" }));
    expect(screen.queryByRole("region", { name: "Selection toolbar" })).not.toBeInTheDocument();
  });
  it("renders a bounded page for a 500-record queue without downloading candidate details", async () => {
    navigation.query = "";
    apiRequestMock.mockResolvedValue({ items: Array.from({ length: 25 }, (_, index) => ({ ...row, id: `application-${index}`, student_name: `Student ${index + 1}` })), total: 500, page: 1 });
    render(<AdminApplications />);
    const table = await screen.findByRole("table", { name: "Applications" });
    await screen.findByRole("button", { name: /Review Student 25 / });
    expect(within(table).getAllByRole("row")).toHaveLength(26);
    expect(screen.getByText("Page 1 of 20")).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });
  it("fetches detail only for the selected candidate and sends reasoned revision-checked decisions", async () => {
    render(<AdminApplications />);
    expect(await screen.findByText(/Active backlogs/)).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith("/admin/recruitment/review-queue/application-1", expect.anything());
    fireEvent.change(screen.getByLabelText("Next recorded stage"), { target: { value: "shortlisted" } });
    fireEvent.change(screen.getByLabelText("Decision explanation and useful next step"), { target: { value: "Your reviewed project evidence meets the published requirements." } });
    csrfRequestMock.mockResolvedValue(application);
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/admin/recruitment/applications/application-1/status", expect.objectContaining({ body: expect.stringContaining('"expected_revision":3') })));
  });
  it("requires an explicit policy reference for overrides and retains feedback publishing", async () => {
    render(<AdminApplications />); await screen.findByText(/Active backlogs/);
    fireEvent.click(screen.getByText("Authorized override"));
    expect(screen.getByLabelText("Policy reference")).toBeRequired();
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Policy permits reviewed equivalent academic evidence." } });
    fireEvent.change(screen.getByLabelText("Policy reference"), { target: { value: "Policy section 4.2" } });
    csrfRequestMock.mockResolvedValue(application);
    fireEvent.click(screen.getByRole("button", { name: "Record override" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(expect.stringContaining("/override"), expect.objectContaining({ body: expect.stringContaining("Policy section 4.2") })));
    fireEvent.click(screen.getByText("Publish student feedback"));
    fireEvent.change(screen.getByLabelText("Update title"), { target: { value: "Review next steps" } });
    fireEvent.change(screen.getByLabelText("Constructive feedback"), { target: { value: "Review your project explanation." } });
    fireEvent.click(screen.getByRole("button", { name: "Publish update" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/admin/notifications", expect.objectContaining({ body: expect.stringContaining("feedback:application-1:under_review") })));
  });
  it("uses page checkboxes and preview revisions before confirming a bulk action", async () => {
    render(<AdminApplications />); await screen.findByText(/Active backlogs/);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Asha Patil for bulk review" }));
    fireEvent.change(within(screen.getByRole("region", { name: "Selection toolbar" })).getByLabelText("Constructive feedback"), { target: { value: "The submitted evidence has been reviewed by the placement team." } });
    csrfRequestMock.mockResolvedValueOnce({ items: [{ application_id: row.id, revision: 3, allowed: true, explanation: "Allowed" }], allowed_count: 1, blocked_count: 0 }).mockResolvedValueOnce({ updated_count: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Preview changes" }));
    const confirmation = await screen.findByRole("button", { name: "Confirm and notify students" });
    await waitFor(() => expect(confirmation).toBeEnabled());
    fireEvent.click(confirmation);
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(expect.stringContaining("/bulk/status"), expect.objectContaining({ body: expect.stringContaining('"expected_revisions":{"application-1":3}') })));
  });
  it("preserves URL filters and candidate identity during navigation", async () => {
    navigation.query = "application_status=under_review&page=2&selected=application-1";
    window.history.replaceState(null, "", "/admin/applications?" + navigation.query);
    render(<AdminApplications />);
    await screen.findByText(/Active backlogs/);
    expect(apiRequestMock).toHaveBeenCalledWith("/admin/recruitment/review-queue?application_status=under_review&page=2", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(navigation.push).toHaveBeenCalledWith("/admin/applications?application_status=under_review&page=3", { scroll: false });
  });
});
