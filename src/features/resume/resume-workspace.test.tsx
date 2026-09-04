import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResumeWorkspace } from "./resume-workspace";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn(), csrfRequestMock: vi.fn() }));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  cachedApiRequest: apiRequestMock,
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
  review_revision: 0,
  evidence_digest: "a".repeat(64),
  generator_version: null,
  processing_stage: "quarantined",
  safe_error_code: null,
  extracted_data: {},
  job: { id: "job-1", status: "queued", attempts: 0, max_attempts: 3, safe_error_code: null, retryable: false, cancellable: true, started_at: null, finished_at: null, duration_ms: null, stage: "quarantined" },
  suggestions: [],
  locked_by_application: false,
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
    expect(screen.getByText("Stored privately and waiting for the malware scanner.")).toBeInTheDocument();
  });

  it("compares evidence and explains application-locked deletion", async () => {
    apiRequestMock.mockResolvedValueOnce([
      { ...version, status: "completed", processing_stage: "ready", scan_status: "clean", extracted_data: { accepted: { skills: ["Python"] } } },
      { ...version, id: "resume-2", version_number: 2, original_name: "latest.pdf", status: "completed", processing_stage: "ready", scan_status: "clean", locked_by_application: true, extracted_data: { accepted: { skills: ["Python", "SQL"] } } },
    ]);
    render(<ResumeWorkspace />);

    expect(await screen.findByText("Locked by application")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Earlier version"), { target: { value: "resume-1" } });
    fireEvent.change(screen.getByLabelText("Later version"), { target: { value: "resume-2" } });
    expect(screen.getByRole("table", { name: "Resume version comparison" })).toHaveTextContent("Python, SQL");
    expect(screen.getAllByRole("button", { name: /Delete/i })).toHaveLength(1);
  });

  it("continues status refresh after a transient polling failure", async () => {
    vi.useFakeTimers();
    try {
      apiRequestMock
        .mockResolvedValueOnce([version])
        .mockRejectedValueOnce(new Error("temporary network loss"))
        .mockResolvedValueOnce({ ...version, status: "processing", processing_stage: "parsing" });
      render(<ResumeWorkspace />);

      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      await act(async () => { await vi.advanceTimersByTimeAsync(1_500); });
      expect(screen.getByText(/status refresh will retry automatically/i)).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(3_000); });
      expect(screen.getByText("A network-isolated parser is extracting proposed details.")).toBeInTheDocument();
      expect(apiRequestMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
