import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LegalContent } from "./legal-content";

const legalDocuments = [
  "terms",
  "accessibility",
  "security",
  "acceptable-use",
  "data-rights",
  "appeals",
] as const;

describe("LegalContent", () => {
  it.each(legalDocuments)("omits shared guidance navigation for %s", (document) => {
    render(<LegalContent document={document} />);

    expect(screen.queryByRole("navigation", { name: "Guidance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Help center" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Service status" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});
