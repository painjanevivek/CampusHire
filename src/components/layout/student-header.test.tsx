import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHeader } from "./student-header";

const route = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/features/engagement/activation-progress", () => ({
  ActivationProgress: () => <span>Activation progress</span>,
}));
vi.mock("@/features/engagement/notification-center", () => ({
  NotificationCenter: () => <span>Notifications</span>,
}));
vi.mock("./sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("StudentHeader", () => {
  beforeEach(() => {
    route.pathname = "/dashboard";
  });

  it("derives the active navigation item from the current route", () => {
    const { rerender } = render(<StudentHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    route.pathname = "/applications/application-1";
    rerender(<StudentHeader />);

    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps student features gated during onboarding and explains how to unlock AI tools", () => {
    route.pathname = "/onboarding";
    render(<StudentHeader />);

    const featureLinks = [
      "CampusHire Student Dashboard",
      "Dashboard",
      "Opportunities",
      "Applications",
      "Preparation",
      "Ask CampusHire Copilot",
    ];
    for (const label of featureLinks) {
      fireEvent.click(screen.getByRole("link", { name: label }));
    }

    expect(screen.getByRole("status")).toHaveTextContent(
      "Complete your student profile to unlock CampusHire’s AI Copilot and student features.",
    );
  });
});
