import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResumeBuilder } from "./resume-builder";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("version=resume-1"),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const suggestion = {
  id: "suggestion-1",
  field_path: "projects.0",
  original_text: "Worked on a placement project.",
  proposed_text: "Contributed to a placement project.",
  rationale: "Uses a specific contribution verb without adding an outcome or metric.",
  status: "pending",
  decided_text: null,
};

const version = {
  id: "resume-1",
  version_number: 3,
  source: "upload",
  original_name: "asha-resume.pdf",
  status: "review_required",
  scan_status: "clean",
  page_count: 1,
  created_at: "2026-08-24T00:00:00Z",
  review_completed_at: null,
  safe_error_code: null,
  extracted_data: {
    proposed: { full_name: "Asha Patil", email: "asha@example.edu" },
    decisions: {},
  },
  job: null,
  suggestions: [suggestion],
};

describe("ResumeBuilder", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(version);
  });

  it("preserves the page heading while resume data is loading", () => {
    apiRequestMock.mockImplementation(() => new Promise(() => undefined));

    render(<ResumeBuilder />);

    expect(screen.getByRole("heading", { name: "Resume review" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading review workspace");
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps every wording suggestion student-controlled", async () => {
    csrfRequestMock.mockResolvedValue({
      ...version,
      suggestions: [{ ...suggestion, status: "edited", decided_text: "Contributed to a reviewed placement workflow." }],
    });
    render(<ResumeBuilder />);

    expect(await screen.findByText("Worked on a placement project.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resume review" })).toBeInTheDocument();
    expect(screen.getByText("Contributed to a placement project.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit suggestion" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit proposed resume language" }), {
      target: { value: "Contributed to a reviewed placement workflow." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save edited suggestion" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/resumes/resume-1/suggestions/suggestion-1",
      expect.objectContaining({ method: "POST" }),
    ));
    expect(await screen.findByText("Decision recorded: edited.")).toBeInTheDocument();
  });

  it("requires an explicit decision for every extracted field", async () => {
    csrfRequestMock.mockResolvedValue({
      ...version,
      extracted_data: {
        ...version.extracted_data,
        decisions: {
          full_name: { action: "accept", value: "Asha Patil" },
          email: { action: "reject", value: "asha@example.edu" },
        },
      },
    });
    render(<ResumeBuilder />);

    await screen.findByRole("combobox", { name: "Decision for full name" });
    fireEvent.change(screen.getByRole("combobox", { name: "Decision for full name" }), { target: { value: "accept" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Decision for email" }), { target: { value: "reject" } });
    fireEvent.click(screen.getByRole("button", { name: "Save extraction decisions" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/resumes/resume-1/review",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
