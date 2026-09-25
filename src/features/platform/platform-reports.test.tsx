import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
}));

import { PlatformReports } from "./platform-reports";

const group = {
  company_name: "NVIDIA", drive_title: "Graduate Engineer", cycle_year: 2026,
  drive_count: 2, student_count: 2, application_count: 2,
  institutions: [
    { institution_id: "college-1", institution_name: "PCCOE", drive_ids: ["drive-1"], drives: [{ id: "drive-1", opens_at: "2026-09-01T00:00:00Z", deadline_at: "2026-10-01T00:00:00Z", status: "published" }], student_count: 1, application_count: 1 },
    { institution_id: "college-2", institution_name: "PCU", drive_ids: ["drive-2"], drives: [{ id: "drive-2", opens_at: "2026-09-01T00:00:00Z", deadline_at: "2026-10-01T00:00:00Z", status: "published" }], student_count: 1, application_count: 1 },
  ],
};
const applicant = {
  application_id: "application-1", drive_id: "drive-1", institution_id: "college-1",
  institution_name: "PCCOE", student_name: "Asha Patil", prn: "124B1B280",
  prn_verified: true, role_title: "Software Engineer", application_status: "submitted",
  submitted_at: "2026-09-20T12:00:00Z",
};

describe("PlatformReports", () => {
  beforeEach(() => {
    apiRequestMock.mockReset().mockImplementation((path: string) => {
      if (path.endsWith("/summary")) return Promise.resolve({
        institution_count: 2, student_count: 2, drive_count: 2,
        application_count: 2, applications_by_status: { submitted: 2 },
        generated_at: "2026-09-25T12:00:00Z", provisional: true,
      });
      if (path.includes("/institutions?")) return Promise.resolve({
        items: [{ id: "college-1", name: "PCCOE" }, { id: "college-2", name: "PCU" }], total: 2,
      });
      if (path.includes("/drive-groups?")) return Promise.resolve({
        items: [group], page: 1, page_size: 20, total: 1,
      });
      if (path.includes("/drive-applicants?")) return Promise.resolve({
        items: path.includes("institution_id=college-2") ? [] : [applicant],
        page: 1, page_size: 50, total: path.includes("institution_id=college-2") ? 0 : 1,
      });
      if (path.includes("/applications/application-1")) return Promise.resolve({
        applicant, profile_snapshot: { full_name: "Asha Patil" },
        resume_snapshot: { version: 1 }, facts_snapshot: { cgpa: 8.5 },
        eligibility_snapshot: { eligible: true }, application_form_snapshot: {},
        acknowledgment_snapshot: { confirmed: true }, disclosure_status: "not_configured",
        evidence_provenance: "submitted_packet",
      });
      return Promise.reject(new Error("Unexpected report path"));
    });
  });

  it("drills from grouped drives to a student's submitted record", async () => {
    render(<PlatformReports />);
    expect(await screen.findByRole("heading", { name: "Current application stages" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /NVIDIA/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Asha Patil/ }));
    expect(await screen.findByRole("heading", { name: "Profile at submission" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Eligibility result" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open PCU applicants" }));
    expect(apiRequestMock).toHaveBeenCalledWith(expect.stringContaining("institution_id=college-2"), expect.anything());
    expect(await screen.findByText("No applications for this selection.")).toBeInTheDocument();
  });

  it("requests an institution-scoped CSV export", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true, blob: async () => new Blob(["csv"]),
    } as Response);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:report") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<PlatformReports />);
    fireEvent.click(await screen.findByRole("button", { name: /NVIDIA/ }));
    fireEvent.click(screen.getByRole("button", { name: "Download PCCOE applicants" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("institution_id=college-1"),
      expect.objectContaining({ credentials: "include" }),
    ));
    fetchMock.mockRestore();
    click.mockRestore();
  });

  it("filters ongoing drive groups to the selected college", async () => {
    render(<PlatformReports />);
    fireEvent.change(await screen.findByRole("combobox", { name: "College" }), {
      target: { value: "college-2" },
    });
    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("institution_id=college-2"), expect.anything(),
    ));
  });
});
