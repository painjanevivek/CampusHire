import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";
import { AdminOverview } from "./admin-overview";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

describe("AdminOverview", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path.endsWith("/companies")) return [{ id: "company-1" }, { id: "company-2" }] as never;
      if (path.endsWith("/drives")) return [{ status: "published" }, { status: "draft" }] as never;
      if (path.includes("/applications?")) {
        return {
          items: [
            { status: "submitted", eligibility_snapshot: { status: "eligible" } },
            { status: "under_review", eligibility_snapshot: { status: "needs_manual_review" } },
          ],
        } as never;
      }
      return { metrics: [{ event_name: "invitation_accepted", count: 9 }], window_days: 30 } as never;
    });
  });

  it("groups review work separately from the operating snapshot", async () => {
    render(<AdminOverview />);

    expect(await screen.findByRole("heading", { name: "2 applications need review." })).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Placement operations summary" });
    expect(within(summary).getByText("Review queue")).toBeInTheDocument();
    expect(within(summary).getByRole("heading", { name: "Live placement activity" })).toBeInTheDocument();
    expect(within(summary).getByText("Published drives")).toBeInTheDocument();
    expect(within(summary).getByText("Company records")).toBeInTheDocument();
    expect(within(summary).getByText("Invitations accepted")).toBeInTheDocument();
  });
});
