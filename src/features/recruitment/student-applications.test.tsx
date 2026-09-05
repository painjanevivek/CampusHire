import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cachedApiRequest } from "@/lib/api/client";
import { StudentApplications } from "./student-applications";

vi.mock("@/lib/api/client", () => ({ cachedApiRequest: vi.fn() }));

const application = {
  id: "application-one", status: "under_review",
  role_snapshot: { title: "Backend Engineer", company_name: "Meridian Systems" },
  resume_snapshot: { version_number: 2 }, rule_snapshot: { version: 3 },
  institution_timezone: "Asia/Kolkata", created_at: "2026-09-04T10:00:00Z",
  next_step: "Your response is with the placement team.",
  history: [{ id: "event-one", to_status: "submitted", created_at: "2026-09-04T10:00:00Z", reason: "Application received." }],
};

describe("StudentApplications", () => {
  beforeEach(() => vi.resetAllMocks());

  it("presents a labelled count, status, saved versions and the original history", async () => {
    vi.mocked(cachedApiRequest).mockResolvedValue([application]);
    render(<StudentApplications />);
    expect(await screen.findByText("1 application")).toBeVisible();
    const card = screen.getByRole("article", { name: "Backend Engineer at Meridian Systems" });
    expect(within(card).getByText("Under review")).toBeVisible();
    expect(within(card).getByText("Resume v2")).toBeVisible();
    expect(within(card).getByText("Rule v3")).toBeVisible();
    expect(within(card).getByText(application.next_step)).toBeVisible();
    expect(within(card).getByRole("link", { name: "Open application for Backend Engineer at Meridian Systems" })).toHaveAttribute("href", "/applications/application-one");
    fireEvent.click(within(card).getByText("View status history"));
    expect(within(card).getByText("Application received.")).toBeVisible();
  });

  it("offers opportunity browsing for a genuinely empty list", async () => {
    vi.mocked(cachedApiRequest).mockResolvedValue([]);
    render(<StudentApplications />);
    expect(await screen.findByRole("heading", { name: "No applications yet" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Explore opportunities/ })).toHaveAttribute("href", "/opportunities");
  });

  it("does not present a failed request as an empty application record", async () => {
    vi.mocked(cachedApiRequest).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce([application]);
    render(<StudentApplications />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.queryByRole("heading", { name: "No applications yet" })).not.toBeInTheDocument();
    fireEvent.click(retry);
    expect(await screen.findByText("1 application")).toBeVisible();
    expect(cachedApiRequest).toHaveBeenLastCalledWith("/applications", { force: true });
  });
});
