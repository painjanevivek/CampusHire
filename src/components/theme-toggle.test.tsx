import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSynchronizer } from "./theme-toggle";

function setSystemTheme(prefersLight: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: prefersLight,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("ThemeSynchronizer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("restores a saved theme on routes without a theme toggle", () => {
    window.localStorage.setItem("campushire-theme", "light");
    setSystemTheme(false);

    render(<ThemeSynchronizer />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("uses the system preference when no theme has been saved", () => {
    setSystemTheme(true);

    render(<ThemeSynchronizer />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});
