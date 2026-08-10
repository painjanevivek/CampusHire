import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpportunitiesWorkspace } from "./opportunities-workspace";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("q=React&location=Pune"),
}));

describe("OpportunitiesWorkspace", () => {
  beforeEach(() => replaceMock.mockReset());

  it("loads keyword and location from the URL", () => {
    render(<OpportunitiesWorkspace />);

    expect(screen.getByLabelText("Job title, keywords, or company")).toHaveValue("React");
    expect(screen.getByLabelText("City, state, or remote")).toHaveValue("Pune");
    expect(screen.getByRole("button", { name: /Frontend Developer at Contour Software/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /AI\/ML Intern at Nexora Labs/ })).not.toBeInTheDocument();
  });

  it("selects a result without losing the list", () => {
    render(<OpportunitiesWorkspace />);

    const result = screen.getByRole("button", { name: /Frontend Developer at Contour Software/ });
    fireEvent.click(result);

    expect(result).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "Frontend Developer details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Eligibility explained" })).toBeInTheDocument();
    expect(screen.getByText("Match is decision support, not hiring probability.")).toBeInTheDocument();
  });

  it("offers a useful recovery when filters return no roles", () => {
    render(<OpportunitiesWorkspace />);

    fireEvent.change(screen.getByLabelText("Job title, keywords, or company"), {
      target: { value: "astronaut" },
    });

    const emptyState = screen.getByRole("status");
    expect(emptyState).toHaveTextContent("No roles match");
    fireEvent.click(within(emptyState).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("button", { name: /AI\/ML Intern at Nexora Labs/ })).toBeInTheDocument();
  });
});
