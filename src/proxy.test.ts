import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("frontend security policy", () => {
  it("uses a per-request nonce and denies executable fallback sources", () => {
    const response = proxy(new NextRequest("http://localhost:3000/dashboard"));
    const policy = response.headers.get("Content-Security-Policy") ?? "";

    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("redirects signed-out student routes with a relative return target", () => {
    const response = proxy(new NextRequest("http://localhost:3000/opportunities?mode=remote"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?returnTo=%2Fopportunities%3Fmode%3Dremote",
    );
  });

  it("redirects signed-out administrator routes to the separate admin entry", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/applications"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/sign-in?returnTo=%2Fadmin%2Fapplications",
    );
  });

  it("allows a protected request with a session cookie to reach authoritative resolution", () => {
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "campushire_session=opaque-session" },
    });

    expect(proxy(request).headers.get("location")).toBeNull();
  });
});
