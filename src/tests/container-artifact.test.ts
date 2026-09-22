import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("production container artifact", () => {
  it("embeds immutable candidate and OpenAPI traceability labels", () => {
    const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");

    expect(dockerfile).toContain("org.opencontainers.image.revision");
    expect(dockerfile).toContain("org.opencontainers.image.created");
    expect(dockerfile).toContain("com.campushire.openapi-sha256");
    expect(dockerfile).toContain("ARG VCS_REF=unknown");
    expect(dockerfile).toContain("ARG OPENAPI_SHA256=unknown");
  });
});
