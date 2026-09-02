import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiPath, apiRequest, csrfRequest } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "campushire_csrf=; Max-Age=0; Path=/";
});

describe("API client", () => {
  it("rejects absolute, protocol-relative, and traversal request paths", () => {
    expect(() => apiPath("https://evil.example/collect")).toThrow(
      "safe relative paths",
    );
    expect(() => apiPath("//evil.example/collect")).toThrow("safe relative paths");
    expect(() => apiPath("/resumes/../auth/me")).toThrow("safe relative paths");
    expect(apiPath("/opportunities?q=python")).toMatch(
      /\/api\/v1\/opportunities\?q=python$/,
    );
  });

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

  it("preserves typed conflict details for recoverable editing flows", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: {
        code: "profile_revision_conflict",
        message: "The profile changed in another session.",
        current_revision: 4,
      },
    }), { status: 409, headers: { "Content-Type": "application/json" } })));

    await expect(apiRequest("/profile")).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: "profile_revision_conflict",
      details: expect.objectContaining({ current_revision: 4 }),
    }));
  });

  it.each([
    [401, "unauthenticated"],
    [403, "forbidden"],
    [409, "conflict"],
    [422, "validation"],
    [429, "rate-limit"],
    [503, "dependency"],
    [500, "server"],
  ] as const)("classifies HTTP %s as %s", (status, expected) => {
    expect(ApiError.fromStatus(status, "Request failed").kind).toBe(expected);
  });

  it("classifies offline and timeout failures without rendering them as empty data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")));
    await expect(apiRequest("/profile")).rejects.toEqual(
      expect.objectContaining({ kind: "offline" }),
    );

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(
      new DOMException("The operation timed out", "TimeoutError"),
    ));
    await expect(apiRequest("/profile")).rejects.toEqual(
      expect.objectContaining({ kind: "timeout" }),
    );
  });

  it("refreshes a rejected CSRF token once and retries the mutation", async () => {
    document.cookie = "campushire_csrf=stale; Path=/";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          error: {
            code: "csrf_validation_failed",
            message: "CSRF validation failed",
          },
        }), {
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
