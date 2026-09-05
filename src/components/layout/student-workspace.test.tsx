import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentWorkspace } from "./student-workspace";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("StudentWorkspace", () => {
  it("exposes the current section and profile progress to assistive technology", () => {
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
    expect(screen.getAllByRole("link", { name: "Open student profile" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open student profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Preparation" })).toHaveAttribute("href", "/preparation");
    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", "/applications");
  });

  it.each([
    ["Home", "/dashboard"],
    ["Opportunities", "/opportunities"],
    ["Applications", "/applications"],
    ["Preparation", "/resume"],
    ["Preparation", "/roadmap"],
    ["Open student profile", "/profile"],
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
