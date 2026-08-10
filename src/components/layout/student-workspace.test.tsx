import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentWorkspace } from "./student-workspace";

describe("StudentWorkspace", () => {
  it("exposes the current section and profile progress to assistive technology", () => {
    render(
      <StudentWorkspace active="Dashboard">
        <main>Dashboard content</main>
      </StudentWorkspace>,
    );

    const navigation = screen.getByRole("navigation", { name: "Workspace" });
    expect(navigation).toContainElement(
      screen.getByRole("link", { name: "Dashboard" }),
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("progressbar", { name: "Profile completion" }),
    ).toHaveAttribute("aria-valuenow", "70");
  });

  it.each([
    "Dashboard",
    "Opportunities",
    "My Resume",
    "Career Roadmap",
    "Profile",
  ] as const)("keeps one shared navigation when %s is active", (active) => {
    render(
      <StudentWorkspace active={active}>
        <main>{active} content</main>
      </StudentWorkspace>,
    );

    expect(screen.getAllByRole("navigation", { name: "Workspace" })).toHaveLength(1);
    expect(screen.getByRole("complementary", { name: "Student workspace" })).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toEqual([
      screen.getByRole("link", { name: active }),
    ]);

    cleanup();
  });
});
