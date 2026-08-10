import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OpportunitySearch } from "./opportunity-search";

describe("OpportunitySearch", () => {
  it("submits trimmed keyword and location values", () => {
    const onSubmit = vi.fn();
    render(
      <OpportunitySearch
        keyword="  data analyst "
        location=" Hyderabad "
        onKeywordChange={() => undefined}
        onLocationChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.submit(screen.getByRole("search"));

    expect(onSubmit).toHaveBeenCalledWith({
      keyword: "data analyst",
      location: "Hyderabad",
    });
  });

  it("keeps the action unavailable when both fields are blank", () => {
    render(
      <OpportunitySearch
        keyword=""
        location=""
        onKeywordChange={() => undefined}
        onLocationChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Find opportunities" })).toBeDisabled();
  });
});
