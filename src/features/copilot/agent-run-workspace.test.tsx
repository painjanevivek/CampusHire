import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgentRunWorkspace } from "./agent-run-workspace";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const opportunity = {
  id: "role-1",
  drive_id: "drive-1",
  company_name: "Nexora Labs",
  drive_title: "Graduate engineering",
  title: "Software Engineer",
  description: "Build reliable product systems.",
  employment_type: "full-time",
  location: "Bengaluru",
  work_mode: "hybrid",
  salary_display: null,
  skills: ["Python"],
  requirements: ["B.Tech"],
  status: "published",
  published_at: "2026-09-01T00:00:00Z",
  deadline_at: "2027-09-01T00:00:00Z",
  eligibility: {
    status: "eligible",
    rule_set_id: "rules-1",
    rule_version: "1",
    results: [],
    missing_evidence: [],
  },
  saved: false,
  application_id: null,
  application_status: null,
};

const limits = {
  model_calls_remaining: 3,
  tool_calls_remaining: 3,
  correction_attempts_remaining: 1,
  active_seconds_remaining: 89,
  reserved_cost_microunits: 30000,
  actual_cost_microunits: 10,
};

const drive = {
  id: "drive-1",
  title: "Graduate engineering",
  revision: 4,
};

describe("AgentRunWorkspace", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/opportunities?page_size=100") {
        return Promise.resolve({ items: [opportunity], page: 1, page_size: 100, total: 1 });
      }
      if (path.endsWith("/practice-consent")) {
        return Promise.resolve({
          consent_version: "1",
          opted_in: false,
          granted_at: null,
          revoked_at: null,
        });
      }
      if (path.includes("/runs?target_id=")) return Promise.resolve([]);
      if (path.includes("/events")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected API path: ${path}`));
    });
  });

  it("selects a real opportunity and explains the private evidence boundary", async () => {
    render(<AgentRunWorkspace audience="student" />);

    expect(await screen.findByRole("option", { name: "Software Engineer" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/role id/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Missing resume evidence means unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/Practice conversations, free-text answers/i)).toBeInTheDocument();
  });

  it("creates a bounded run with an idempotency key", async () => {
    csrfRequestMock.mockResolvedValue({
      id: "run-1",
      status: "queued",
      revision: 1,
      target_id: "role-1",
      source_fingerprint: null,
      required_action: null,
      safe_error: null,
      limits: {
        model_calls_remaining: 4,
        tool_calls_remaining: 6,
        correction_attempts_remaining: 1,
        active_seconds_remaining: 90,
        reserved_cost_microunits: 30000,
        actual_cost_microunits: 0,
      },
      artifact: null,
    });
    render(<AgentRunWorkspace audience="student" />);

    await screen.findByRole("option", { name: "Software Engineer" });
    fireEvent.change(screen.getByLabelText("Published opportunity"), {
      target: { value: "role-1" },
    });
    const submit = screen.getByRole("button", { name: "Start bounded preparation" });
    fireEvent.click(submit);

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    const [path, request] = csrfRequestMock.mock.calls[0];
    expect(path).toBe("/ai/student-copilot/runs");
    expect(request.method).toBe("POST");
    expect(request.headers["Idempotency-Key"]).toBeTruthy();
    expect(JSON.parse(request.body)).toMatchObject({
      role_id: "role-1",
      available_minutes_per_week: 300,
    });
  });

  it("records explicit practice consent without changing the private default", async () => {
    csrfRequestMock.mockResolvedValue({
      purpose: "practice_aggregates",
      consent_version: "1",
      opted_in: true,
      granted_at: "2026-09-14T10:00:00Z",
      revoked_at: null,
    });
    render(<AgentRunWorkspace audience="student" />);

    const optIn = await screen.findByRole("button", { name: "Opt in" });
    expect(optIn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(optIn);

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/ai/student-copilot/practice-consent",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ consent_version: "1", opted_in: true }),
      }),
    ));
    expect(await screen.findByRole("button", { name: "Withdraw consent" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("resumes a matching interruption and keeps cancellation available", async () => {
    const interruptedRun = {
      id: "run-interrupted",
      audience: "student",
      workflow: "prepare_opportunity",
      target_kind: "role",
      target_id: "role-1",
      status: "awaiting_input",
      revision: 5,
      source_fingerprint: "source-fingerprint",
      required_action: {
        type: "clarification",
        interrupt_id: "clarify-4",
        question: "Which outcome should the plan prioritize?",
      },
      safe_error: null,
      limits,
      artifact: null,
      created_at: "2026-09-14T10:00:00Z",
      updated_at: "2026-09-14T10:01:00Z",
    };
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/opportunities?page_size=100") {
        return Promise.resolve({ items: [opportunity], page: 1, page_size: 100, total: 1 });
      }
      if (path.endsWith("/practice-consent")) {
        return Promise.resolve({
          purpose: "practice_aggregates",
          consent_version: "1",
          opted_in: false,
          granted_at: null,
          revoked_at: null,
        });
      }
      if (path.includes("/runs?target_id=")) return Promise.resolve([interruptedRun]);
      if (path.includes("/events")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected API path: ${path}`));
    });
    csrfRequestMock.mockResolvedValue({
      ...interruptedRun,
      status: "queued",
      revision: 6,
      required_action: null,
    });
    render(<AgentRunWorkspace audience="student" />);

    expect(await screen.findByRole("heading", { name: "Which outcome should the plan prioritize?" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete private task" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Prioritize a small Python API exercise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resume with answer" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/ai/student-copilot/runs/run-interrupted/resume",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          expected_revision: 5,
          interrupt_id: "clarify-4",
          response: "Prioritize a small Python API exercise.",
        }),
      }),
    ));
  });

  it("sends only fresh approved source evidence into a T&P drive run", async () => {
    const sources = [
      {
        id: "source-unverified",
        review_status: "approved",
        active: true,
        last_verified_at: null,
        safe_error: null,
      },
      {
        id: "source-fresh",
        review_status: "approved",
        active: true,
        last_verified_at: "2026-09-14T10:00:00Z",
        safe_error: null,
      },
      {
        id: "source-changed",
        review_status: "approved",
        active: true,
        last_verified_at: "2026-09-14T10:00:00Z",
        safe_error: "changed_source_pending_review",
      },
    ];
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/admin/recruitment/drives") return Promise.resolve([drive]);
      if (path.endsWith("/sources")) return Promise.resolve(sources);
      if (path.includes("/runs?target_id=")) return Promise.resolve([]);
      if (path.includes("/events")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected API path: ${path}`));
    });
    csrfRequestMock.mockResolvedValue({
      id: "tnp-run-1",
      audience: "tnp",
      workflow: "prepare_drive",
      target_kind: "drive",
      target_id: "drive-1",
      status: "queued",
      revision: 1,
      source_fingerprint: null,
      required_action: null,
      safe_error: null,
      limits,
      artifact: null,
      created_at: "2026-09-14T10:00:00Z",
      updated_at: "2026-09-14T10:00:00Z",
    });
    render(<AgentRunWorkspace audience="tnp" />);

    await screen.findByRole("option", { name: "Graduate engineering" });
    fireEvent.change(screen.getByLabelText("Authorized recruiter brief"), {
      target: { value: "Use the reviewed recruiter brief for this drive." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start bounded preparation" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(csrfRequestMock.mock.calls[0][1].body)).toMatchObject({
      drive_id: "drive-1",
      expected_revision: 4,
      source_version_ids: ["source-fresh"],
    });
  });
});
