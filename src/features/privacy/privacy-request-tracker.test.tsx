import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrivacyRequestTracker } from "./privacy-request-tracker";

vi.mock("@/features/experience/use-resource", () => ({
  useResource: () => ({
    data: [{
      id: "privacy-1",
      request_type: "erasure",
      status: "processing",
      details: "Remove eligible data.",
      owner_user_id: "officer-1",
      due_at: "2026-09-30T10:00:00Z",
      result_summary: "Database records removed; private cleanup queued.",
      resolution_effect: "eligible_data_erased",
      processing_receipt: { database: "completed", private_storage: "pending", external_processors: "not_configured" },
      cleanup_request_id: "cleanup-1",
      receipt_reference: "PR-SYNTHETIC",
      created_at: "2026-09-20T10:00:00Z",
      completed_at: null,
    }],
    loading: false,
    error: "",
    refresh: vi.fn(),
  }),
}));
vi.mock("@/lib/api/client", () => ({ csrfRequest: vi.fn() }));

describe("PrivacyRequestTracker", () => {
  it("shows cross-system processing without falsely marking the request complete", () => {
    render(<PrivacyRequestTracker />);
    expect(screen.getByText("processing")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Receipt and request details"));
    expect(screen.getByText("database")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("private storage")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("PR-SYNTHETIC")).toBeInTheDocument();
  });
});
