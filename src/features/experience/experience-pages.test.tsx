import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Comparison } from "./comparison";
import { Preparation } from "./preparation";
import { Reports } from "./reports";
import { SavedViews } from "./saved-views";

const mocks = vi.hoisted(() => ({ search: "", resource: vi.fn(), api: vi.fn(), csrf: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(mocks.search) }));
vi.mock("./use-resource", () => ({ useResource: (path: string) => mocks.resource(path) }));
vi.mock("@/lib/api/client", () => ({ apiRequest: mocks.api, csrfRequest: mocks.csrf }));

describe("Product experience pages", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.search = ""; mocks.resource.mockReturnValue({ data: [], refresh: mocks.refresh, loading: false }); mocks.csrf.mockResolvedValue({}); });

  it("compares missing and unavailable role details without invented values", async () => {
    mocks.search = "roles=11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222";
    mocks.api.mockResolvedValueOnce({ id: "one", company_name: "Synthetic company", title: "Engineer", location: "", work_mode: "remote", employment_type: "full-time", salary_display: null, deadline_at: "2026-09-12T00:00:00Z", requirements: [], skills: [], eligibility: { status: "eligible", results: [] } }).mockRejectedValueOnce(new Error("unavailable"));
    render(<Comparison />);
    expect(await screen.findByRole("table", { name: "Current opportunity comparison" })).toBeInTheDocument();
    expect(screen.getAllByText("Not provided").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Retry unavailable roles" })).toBeInTheDocument();
  });

  it("keeps preparation separate from eligibility and exposes outdated sources", () => {
    mocks.search = "role=example";
    mocks.resource.mockImplementation(path => ({ data: path === "/resumes" ? [] : { role_title: "Engineer", source_resume_version_id: "reviewed-version", source_profile_revision: 3, guidance_stale: true, evidence: [{ requirement: "Python", evidence: "Not demonstrated in your profile or reviewed resume.", demonstrated: false }], requirements: [], suggestions: [], mapping_status: "No approved requirement-to-roadmap mapping is available for this role.", activities: [] }, refresh: mocks.refresh }));
    render(<Preparation />);
    expect(screen.getByText(/This is preparation guidance, not an eligibility decision/)).toBeInTheDocument();
    expect(screen.getByText(/Your profile changed after this resume version/)).toBeInTheDocument();
    expect(screen.getByText(/No approved requirement-to-roadmap mapping/)).toBeInTheDocument();
    expect(mocks.csrf).not.toHaveBeenCalled();
  });

  it("shows no data and preserves report drill-down meaning", () => {
    mocks.resource.mockImplementation(path => ({ data: path === "/admin/recruitment/drives" ? [] : { start_at: "2026-08-01T00:00:00Z", end_at: "2026-09-01T00:00:00Z", timezone: "UTC", metrics: [{ key: "review", label: "First review turnaround", value: null, sample_size: 0, explanation: "No recorded first departures.", href: "/admin/applications?review_pending=true" }] }, refresh: mocks.refresh }));
    render(<Reports />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Sample: 0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View source records" })).toHaveAttribute("href", "/admin/applications?review_pending=true");
  });

  it("saves only supported filter preferences, never role data or pagination", async () => {
    render(<SavedViews query="q=Python&sort=deadline&page=4&salary=secret" />);
    fireEvent.click(screen.getByText("Saved filter views"));
    fireEvent.change(screen.getByLabelText("View name"), { target: { value: "Python deadlines" } });
    fireEvent.click(screen.getByRole("button", { name: "Save current filters" }));
    await waitFor(() => expect(mocks.csrf).toHaveBeenCalledWith("/opportunity-views", { method: "POST", body: JSON.stringify({ name: "Python deadlines", filters: { q: "Python", sort: "deadline" } }) }));
  });
});
