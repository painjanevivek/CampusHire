import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResumeWorkspace } from "./resume-workspace";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn(), csrfRequestMock: vi.fn() }));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const version = {
  id: "resume-1",
  version_number: 1,
  source: "upload",
  original_name: "asha-resume.pdf",
  status: "queued",
  scan_status: "quarantined",
  page_count: null,
  created_at: "2026-08-24T00:00:00Z",
  review_completed_at: null,
  safe_error_code: null,
  extracted_data: {},
  job: { id: "job-1", status: "queued", attempts: 0, max_attempts: 3, safe_error_code: null, retryable: false },
  suggestions: [],
};

describe("ResumeWorkspace", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([]);
  });

  it("uses the shared student page language", () => {
    render(<ResumeWorkspace />);
    expect(screen.getByRole("heading", { name: "Resume" })).toBeInTheDocument();
  });

  it("preserves the selected filename when upload fails", async () => {
    csrfRequestMock.mockRejectedValueOnce(new Error("offline"));
    render(<ResumeWorkspace />);

    await screen.findByText("No resume versions yet");

    const file = new File(["resume"], "asha-resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Resume PDF"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be accepted");
    expect(screen.getByText("asha-resume.pdf")).toBeInTheDocument();
  });

  it("announces a successful immutable resume version", async () => {
    csrfRequestMock.mockResolvedValueOnce({ id: "resume-1", status: "queued", duplicate: false });
    apiRequestMock.mockResolvedValueOnce([]).mockResolvedValueOnce(version);
    render(<ResumeWorkspace />);

    await screen.findByText("No resume versions yet");

    const file = new File(["resume"], "asha-resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Resume PDF"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(await screen.findByRole("status")).toHaveTextContent("stored in quarantine");
    expect(screen.getByText("Queued for safety checks")).toBeInTheDocument();
  });
});
