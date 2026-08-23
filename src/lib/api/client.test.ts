import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, csrfRequest } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "campushire_csrf=; Max-Age=0; Path=/";
});

describe("API client", () => {
  it("normalizes structured backend failures with correlation context", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "internal_error",
              message: "CampusHire could not complete the request.",
              correlation_id: "request-1234",
            },
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(apiRequest("/profile")).rejects.toEqual(
      expect.objectContaining({
        status: 500,
        code: "internal_error",
        correlationId: "request-1234",
      }),
    );
  });

  it("refreshes a rejected CSRF token once and retries the mutation", async () => {
    document.cookie = "campushire_csrf=stale; Path=/";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "CSRF validation failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockImplementationOnce(() => {
        document.cookie = "campushire_csrf=fresh; Path=/";
        return Promise.resolve(new Response(null, { status: 204 }));
      })
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await csrfRequest("/auth/sign-out", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get("X-CSRF-Token"))
      .toBe("fresh");
  });
});
