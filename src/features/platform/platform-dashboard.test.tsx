import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResource } from "@/features/experience/use-resource";
import { PlatformDashboard } from "./platform-workspaces";

vi.mock("@/features/experience/use-resource", () => ({ useResource: vi.fn() }));

const refresh = vi.fn();

describe("PlatformDashboard", () => {
  beforeEach(() => {
    vi.mocked(useResource).mockImplementation((path: string | null) => {
      if (path === "/platform/dashboard") {
        return {
          data: {
            pending_institution_approvals: 0,
            active_institutions: 11,
            tnp_accounts: 9,
            unresolved_service_items: 0,
            overdue_escalations: 0,
            reporting_freshness_at: "2026-09-12T12:00:00Z",
          },
          error: "",
          loading: false,
          refresh,
        };
      }
      return {
        data: {
          items: [
            {
              id: "event-1",
              event_type: "staff_account.created",
              resource_type: "institution_membership",
              resource_id: "membership-1",
              details: { username: "placement.officer" },
              created_at: "2026-09-12T11:42:00Z",
            },
          ],
          page: 1,
          page_size: 20,
          total: 1,
        },
        error: "",
        loading: false,
        refresh,
      };
    });
  });

  it("makes healthy state and the next admin actions immediately clear", () => {
    render(<PlatformDashboard />);

    expect(screen.getByRole("heading", { name: "Everything is up to date" })).toBeInTheDocument();
    expect(screen.getByText("No platform-admin actions currently require attention.")).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Platform summary" });
    expect(within(summary).getByText("Needs attention").closest("article")).toHaveTextContent("0 · All clear");
    expect(within(summary).getByText("11")).toBeInTheDocument();
    expect(within(summary).getByText("9")).toBeInTheDocument();

    const attention = screen.getByRole("region", { name: "Needs attention" });
    expect(within(attention).getByRole("link", { name: /Institution approvals/ })).toHaveAttribute("href", "/admin/institutions#registration-requests-title");
    expect(within(attention).getByRole("link", { name: /Service issues/ })).toHaveAttribute("href", "/admin/notices");
    expect(within(attention).getByRole("link", { name: /Overdue appeals/ })).toHaveAttribute("href", "/admin/institutions");
    expect(within(attention).getByText("No requests awaiting review")).toBeInTheDocument();
    expect(within(attention).getByText("No open service issues")).toBeInTheDocument();
    expect(within(attention).getAllByText("None overdue")).toHaveLength(2);
  });

  it("shows compact quick actions and real platform activity", () => {
    render(<PlatformDashboard />);

    const quickActions = screen.getByRole("navigation", { name: "Platform quick actions" });
    expect(within(quickActions).getByRole("link", { name: /Add institution/ })).toHaveAttribute("href", "/admin/institutions#add-institution");
    expect(within(quickActions).getByRole("link", { name: /Create T&P account/ })).toHaveAttribute("href", "/admin/accounts");
    expect(within(quickActions).getByRole("link", { name: /View reports/ })).toHaveAttribute("href", "/admin/reports");

    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    expect(screen.getByText("T&P account created")).toBeInTheDocument();
    expect(screen.getByText(/placement\.officer/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest application activity" })).toBeInTheDocument();
  });

  it("promotes non-zero work and offers its relevant action", () => {
    vi.mocked(useResource).mockImplementation((path: string | null) => ({
      data: path === "/platform/dashboard" ? {
        pending_institution_approvals: 1,
        active_institutions: 11,
        tnp_accounts: 9,
        unresolved_service_items: 2,
        overdue_escalations: 0,
        reporting_freshness_at: null,
      } : { items: [], page: 1, page_size: 20, total: 0 },
      error: "",
      loading: false,
      refresh,
    }));

    render(<PlatformDashboard />);

    expect(screen.getByRole("heading", { name: "3 items need attention" })).toBeInTheDocument();
    expect(screen.getByText("Review the highlighted queues and take the next action.")).toBeInTheDocument();
    expect(screen.getByText("1 request awaiting review")).toBeInTheDocument();
    expect(screen.getByText("2 open service issues")).toBeInTheDocument();
    expect(screen.getByText("No application activity recorded yet.")).toBeInTheDocument();
    expect(screen.getAllByText("Review now").length).toBeGreaterThan(0);
  });

  it("expands the activity list with an accessible button", () => {
    vi.mocked(useResource).mockImplementation((path: string | null) => ({
      data: path === "/platform/dashboard" ? {
        pending_institution_approvals: 0,
        active_institutions: 11,
        tnp_accounts: 9,
        unresolved_service_items: 0,
        overdue_escalations: 0,
        reporting_freshness_at: null,
      } : {
        items: Array.from({ length: 6 }, (_, index) => ({
          id: `event-${index}`,
          event_type: "platform.institution.status_changed",
          resource_type: "institution",
          resource_id: `institution-${index}`,
          details: {},
          created_at: `2026-09-12T0${index}:00:00Z`,
        })),
        page: 1,
        page_size: 20,
        total: 6,
      },
      error: "",
      loading: false,
      refresh,
    }));

    render(<PlatformDashboard />);
    const activity = screen.getByRole("region", { name: "Recent activity" });
    expect(within(activity).getAllByRole("listitem")).toHaveLength(5);
    fireEvent.click(within(activity).getByRole("button", { name: "View all activity" }));
    expect(within(activity).getAllByRole("listitem")).toHaveLength(6);
    expect(within(activity).getByRole("button", { name: "Show recent activity only" })).toBeInTheDocument();
  });
});
