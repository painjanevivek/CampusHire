import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentWorkspace } from "./student-workspace";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("StudentWorkspace", () => {
  it("keeps account actions in a profile menu and help in the footer", () => {
    const { container } = render(
      <StudentWorkspace>
        <main>Dashboard content</main>
      </StudentWorkspace>,
    );

    expect(container.querySelector('[data-workspace="student"]')).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Student navigation" });
    expect(navigation).toContainElement(
      screen.getByRole("link", { name: "Home" }),
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByLabelText("Open activation checklist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Open profile menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/profile#account-settings");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toContainElement(screen.getByRole("link", { name: "Help center" }));
    expect(screen.getByRole("link", { name: "Preparation" })).toHaveAttribute("href", "/preparation");
    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", "/applications");
  });

  it.each([
    ["Home", "/dashboard"],
    ["Opportunities", "/opportunities"],
    ["Applications", "/applications"],
    ["Preparation", "/resume"],
    ["Preparation", "/roadmap"],
  ] as const)("keeps one shared navigation when %s is active", (active, pathname) => {
    navigation.pathname = pathname;
    render(
      <StudentWorkspace>
        <main>{active} content</main>
      </StudentWorkspace>,
    );

    expect(screen.getAllByRole("navigation", { name: "Student navigation" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "CampusHire home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("complementary", { name: "Student workspace" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toEqual([
      screen.getByRole("link", { name: active }),
    ]);

    cleanup();
  });
});
