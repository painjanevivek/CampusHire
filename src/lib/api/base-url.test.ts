import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl } from "./base-url";

describe("API base URL validation", () => {
  it.each([
    "http://api.example/api/v1",
    "http://backend:8000/api/v1",
    "http://localhost.example/api/v1",
    "http://127.0.0.1.example/api/v1",
  ])("rejects plaintext non-loopback origin %s", (value) => {
    expect(() => normalizeApiBaseUrl(value, "INTERNAL_API_URL")).toThrow(
      "must use HTTPS",
    );
  });

  it.each([
    "http://localhost:8000/api/v1",
    "http://127.0.0.1:8001/api/v1",
    "http://[::1]:8000/api/v1",
    "https://api.example/api/v1",
  ])("preserves secure or loopback origin %s", (value) => {
    expect(normalizeApiBaseUrl(value, "NEXT_PUBLIC_API_URL")).toBe(value);
  });

  it.each([
    "//api.example/api/v1",
    "ftp://api.example/api/v1",
    "https://user:secret@api.example/api/v1",
    "https://api.example/api/v1?tenant=other",
    "https://api.example/api/v1#token",
  ])("rejects malformed or authority-changing URL %s", (value) => {
    expect(() => normalizeApiBaseUrl(value, "NEXT_PUBLIC_API_URL")).toThrow();
  });
});
