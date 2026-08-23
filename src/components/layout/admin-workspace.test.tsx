import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminWorkspace } from "./admin-workspace";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/drives" }));

describe("AdminWorkspace", () => {
  it("keeps placement operations separate from student navigation", () => {
    render(
      <AdminWorkspace>
        <main>Admin content</main>
      </AdminWorkspace>,
    );

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
  });
});
