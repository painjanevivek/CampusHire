import { describe, expect, it, vi } from "vitest";

import { trackProductEvent } from "./product-analytics";

describe("trackProductEvent", () => {
  it("dispatches only the approved event name", () => {
    const listener = vi.fn();
    window.addEventListener("campushire:product-event", listener);

    trackProductEvent("profile_start");

    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      name: "profile_start",
    });
    window.removeEventListener("campushire:product-event", listener);
  });
});
