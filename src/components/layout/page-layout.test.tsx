import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentGrid, PageContainer, PageHeader } from "./page-layout";

describe("page layout primitives", () => {
  it("exposes the page context and preserves semantic landmarks", () => {
    render(
      <PageContainer context="admin">
        <PageHeader
          eyebrow="T&P control room"
          title="Placement operations"
          description="Review live college records."
          actions={<button type="button">Refresh</button>}
        />
        <ContentGrid variant="focused" aria-label="Operations summary">
          <article>Review queue</article>
          <article>Operating snapshot</article>
        </ContentGrid>
      </PageContainer>,
    );

    expect(screen.getByRole("main")).toHaveAttribute("data-layout-context", "admin");
    expect(screen.getByRole("heading", { name: "Placement operations" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Operations summary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
