import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentPage } from "./content-page";

describe("ContentPage", () => {
  it("renders navigable policy structure with a single main landmark", () => {
    render(<ContentPage eyebrow="Policy" title="Clear records" introduction="An introduction." summary="A summary." sections={[{ title: "Evidence", body: "Verified evidence remains authoritative." }]} />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("heading", { level: 1, name: "Clear records" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("can omit Help center and Service status from policy headers", () => {
    render(<ContentPage eyebrow="Policy" title="Clear records" introduction="An introduction." summary="A summary." sections={[]} showGuidanceNav={false} />);

    expect(screen.queryByRole("navigation", { name: "Guidance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Help center" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Service status" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});
