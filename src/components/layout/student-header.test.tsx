import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentHeader } from "./student-header";

vi.mock("@/features/engagement/activation-progress", () => ({
  ActivationProgress: () => <button type="button">Activation progress</button>,
}));
vi.mock("@/features/engagement/notification-center", () => ({
  NotificationCenter: () => <button type="button">Notifications</button>,
}));
vi.mock("./sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("StudentHeader", () => {
  it("provides the central student destinations", () => {
    render(<StudentHeader active="Applications" />);

    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", "/applications");
    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });

  it("closes the responsive navigation after selection or Escape", () => {
    render(<StudentHeader />);
    const menu = screen.getByRole("button", { name: "Open student navigation" });

    fireEvent.click(menu);
    expect(screen.getByRole("button", { name: "Close student navigation" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open student navigation" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menu);
    const profile = screen.getByRole("link", { name: "Profile" });
    profile.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(profile);
    expect(screen.getByRole("button", { name: "Open student navigation" })).toHaveAttribute("aria-expanded", "false");
  });
});
