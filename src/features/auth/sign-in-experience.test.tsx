import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignInExperience } from "./sign-in-experience";

vi.mock("next/link", () => ({
  default: ({ replace, ...props }: ComponentProps<"a"> & { replace?: boolean }) => (
    <a {...props} data-history-mode={replace ? "replace" : "push"} />
  ),
}));

vi.mock("@/features/auth/auth-form", () => ({
  AuthForm: ({ workspace, redirectTo }: { workspace: string; redirectTo: string }) => (
    <output data-testid="auth-workspace" data-redirect-to={redirectTo}>{workspace}</output>
  ),
}));

describe("SignInExperience", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/sign-in?returnTo=%2Fdashboard");
  });

  it("switches the sign-in form in place and replaces the URL while preserving returnTo", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<SignInExperience initialRole="student" returnTo="/dashboard" />);

    fireEvent.click(screen.getByRole("link", { name: /training & placement/i }));

    expect(screen.getByText("Training & Placement workspace")).toBeInTheDocument();
    expect(screen.getByTestId("auth-workspace")).toHaveTextContent("tnp");
    expect(screen.getByTestId("auth-workspace")).toHaveAttribute("data-redirect-to", "/tnp/dashboard");
    expect(screen.getByRole("link", { name: /training & placement/i })).toHaveAttribute("aria-current", "page");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/tnp/sign-in?returnTo=%2Fdashboard");
  });
});
