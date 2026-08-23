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
});
