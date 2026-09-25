import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminWorkspace, TnpWorkspace } from "./admin-workspace";

vi.mock("@/features/engagement/notification-center", () => ({
  NotificationCenter: () => <button type="button">Open notifications</button>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("AdminWorkspace", () => {
  it("keeps platform oversight separate from placement operations", () => {
    const { container } = render(
      <AdminWorkspace>
        <main>Admin content</main>
      </AdminWorkspace>,
    );

    expect(container.querySelector('[data-workspace="platform"]')).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Platform administration" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Applications" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Drives" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notices" })).toHaveAttribute("href", "/admin/notices");
    expect(screen.queryByRole("button", { name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "System Health" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Audit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open notifications" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light mode" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" }))
      .toHaveAttribute("href", "/admin/dashboard");
    expect(screen.getByRole("link", { name: "Open profile and account security" }))
      .toHaveAttribute("href", "/admin/account");
  });

  it("shows operational navigation only in the T&P workspace", () => {
    render(<TnpWorkspace role="tnp_admin"><main>T&amp;P content</main></TnpWorkspace>);
    expect(screen.getByRole("navigation", { name: "Placement operations" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Placement operations" }));
    expect(screen.getByRole("link", { name: "Drives" })).toHaveAttribute("href", "/tnp/drives");
    expect(screen.queryByRole("link", { name: "T&P Accounts" })).not.toBeInTheDocument();
  });
});
