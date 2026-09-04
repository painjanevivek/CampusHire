import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminWorkspace } from "./admin-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/drives",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("AdminWorkspace", () => {
  it("keeps placement operations separate from student navigation", () => {
    const { container } = render(
      <AdminWorkspace>
        <main>Admin content</main>
      </AdminWorkspace>,
    );

    expect(container.querySelector('[data-workspace="admin"]')).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Placement operations" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Drives" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("navigation", { name: "Student navigation" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Operations" })).toHaveAttribute(
      "href",
      "/admin/operations",
    );
    expect(screen.queryByRole("button", { name: "Open notifications" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open administrator profile and account" }))
      .toHaveAttribute("href", "/admin/account");
  });
});
