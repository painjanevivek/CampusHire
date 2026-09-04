import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "./brand-mark";

describe("BrandMark", () => {
  it("renders the decorative Bridge C mark without adding duplicate accessible text", () => {
    const { container } = render(<BrandMark className="test-mark" />);
    const mark = container.querySelector('svg[data-brand-mark="bridge-c"]');

    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("focusable", "false");
    expect(mark).toHaveClass("test-mark");
    expect(mark?.querySelectorAll("path")).toHaveLength(2);
  });
});
