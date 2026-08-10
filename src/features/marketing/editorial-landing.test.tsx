import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorialLanding } from "./editorial-landing";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("EditorialLanding", () => {
  beforeEach(() => pushMock.mockReset());

  it("makes opportunity search the first task", () => {
    render(<EditorialLanding />);

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByLabelText("Job title, keywords, or company")).toBeInTheDocument();
    expect(screen.getByLabelText("City, state, or remote")).toBeInTheDocument();
    const action = screen.getByRole("button", { name: "Find opportunities" });
    expect(action).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Job title, keywords, or company"), {
      target: { value: "software engineer" },
    });
    expect(action).toBeEnabled();
  });

  it("sends a keyword and location search to opportunities", () => {
    render(<EditorialLanding />);

    fireEvent.change(screen.getByLabelText("Job title, keywords, or company"), {
      target: { value: "frontend developer" },
    });
    fireEvent.change(screen.getByLabelText("City, state, or remote"), {
      target: { value: "Pune" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith(
      "/opportunities?q=frontend+developer&location=Pune",
    );
  });

  it("keeps one profile action and separates eligibility from match", () => {
    render(<EditorialLanding />);

    expect(screen.getAllByRole("link", { name: "Create profile" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Formal eligibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Role match" })).toBeInTheDocument();
    expect(screen.getByText("A match score never decides formal eligibility.")).toBeInTheDocument();
  });
});
