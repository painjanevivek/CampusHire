import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentWorkspace } from "./student-workspace";

describe("StudentWorkspace", () => {
  it("exposes the current section and profile progress to assistive technology", () => {
    render(
      <StudentWorkspace active="Readiness">
        <main>Dashboard content</main>
      </StudentWorkspace>,
    );

    const navigation = screen.getByRole("navigation", { name: "Student navigation" });
    expect(navigation).toContainElement(
      screen.getByRole("link", { name: "Readiness" }),
    );
    expect(screen.getByRole("link", { name: "Readiness" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Open student profile" })).toBeInTheDocument();
  });

  it.each([
    "Readiness",
    "Opportunities",
    "Resume",
    "Roadmap",
    "Profile",
  ] as const)("keeps one shared navigation when %s is active", (active) => {
    render(
      <StudentWorkspace active={active}>
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
