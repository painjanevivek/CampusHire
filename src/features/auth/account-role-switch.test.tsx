import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountRoleSwitch } from "./account-role-switch";

vi.mock("next/link", () => ({
  default: ({ replace, ...props }: ComponentProps<"a"> & { replace?: boolean }) => (
    <a {...props} data-history-mode={replace ? "replace" : "push"} />
  ),
}));

describe("AccountRoleSwitch", () => {
  it("shows separate student, T&P officer, and Admin paths", () => {
    render(<AccountRoleSwitch current="student" />);

    const navigation = screen.getByRole("navigation", { name: "Choose sign-in account" });
    expect(within(navigation).getByRole("link", { name: /student/i })).toHaveAttribute("href", "/sign-in");
    expect(within(navigation).getByRole("link", { name: /training & placement/i })).toHaveAttribute("href", "/tnp/sign-in");
    expect(within(navigation).getByRole("link", { name: /^admin/i })).toHaveAttribute("href", "/admin/sign-in");
  });

  it("marks the selected Admin workspace without exposing T&P signup", () => {
    render(<AccountRoleSwitch current="admin" />);

    expect(screen.getByRole("link", { name: /^admin/i })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: /register an institution/i })).not.toBeInTheDocument();
  });

  it("replaces sign-in routes so Back skips previous role choices", () => {
    render(<AccountRoleSwitch current="student" />);

    const navigation = screen.getByRole("navigation", { name: "Choose sign-in account" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
    for (const link of within(navigation).getAllByRole("link")) {
      expect(link).toHaveAttribute("data-history-mode", "replace");
    }
  });

  it("lets the sign-in experience switch roles without following the link", () => {
    const onRoleChange = vi.fn();
    render(<AccountRoleSwitch current="student" onRoleChange={onRoleChange} />);

    fireEvent.click(screen.getByRole("link", { name: /training & placement/i }));

    expect(onRoleChange).toHaveBeenCalledWith("tnp");
  });
});
