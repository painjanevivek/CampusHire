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
});
