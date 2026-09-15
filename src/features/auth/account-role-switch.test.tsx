import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountRoleSwitch } from "./account-role-switch";

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
});
