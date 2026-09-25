import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CookiePreferences, CookiePreferenceTrigger } from "./cookie-preferences";

describe("CookiePreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("dismisses the cookie prompt after an essential-only choice", async () => {
    render(<CookiePreferences />);

    expect(await screen.findByRole("heading", { name: "Choose your cookies" })).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Essential only" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Choose your cookies" })).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem("campushire_cookie_preference_v1")).toBe("essential-only");
    expect(screen.queryByRole("button", { name: "Cookie settings" })).not.toBeInTheDocument();
  });

  it("reopens saved preferences from the privacy page control", async () => {
    window.localStorage.setItem("campushire_cookie_preference_v1", "essential-only");
    render(<><CookiePreferences /><CookiePreferenceTrigger /></>);

    expect(screen.queryByRole("heading", { name: "Choose your cookies" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Change cookie preference" });
    fireEvent.click(trigger);

    expect(await screen.findByRole("heading", { name: "Choose your cookies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Essential only" })).toHaveFocus();
  });
});
