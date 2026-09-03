const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const requireHsts = process.env.REQUIRE_HSTS === "true";

for (const variableName of ["NEXT_PUBLIC_API_URL", "INTERNAL_API_URL"]) {
  const configuredApi = process.env[variableName];
  if (!configuredApi) continue;
  const parsed = new URL(configuredApi);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) {
    console.error(
      `CampusHire release smoke failed: ${variableName} must use HTTPS unless it targets loopback.`,
    );
    process.exit(1);
  }
}

const routes = ["/", "/sign-in", "/admin/sign-in", "/privacy"];
const requiredHeaders = new Map([
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["cross-origin-opener-policy", "same-origin"],
  ["cross-origin-resource-policy", "same-site"],
]);

const failures = [];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== 200) {
    failures.push(`${route}: expected 200, received ${response.status}`);
    continue;
  }

  for (const [header, expected] of requiredHeaders) {
    if (response.headers.get(header) !== expected) {
      failures.push(
        `${route}: ${header} must equal ${JSON.stringify(expected)}`,
      );
    }
  }

  const permissions = response.headers.get("permissions-policy") ?? "";
  for (const directive of ["camera=()", "microphone=()", "geolocation=()"]) {
    if (!permissions.includes(directive)) {
      failures.push(`${route}: permissions-policy is missing ${directive}`);
    }
  }

  const csp = response.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ]) {
    if (!csp.includes(directive)) {
      failures.push(`${route}: content-security-policy is missing ${directive}`);
    }
  }

  if (requireHsts && !response.headers.has("strict-transport-security")) {
    failures.push(`${route}: strict-transport-security is required`);
  }
}

if (failures.length > 0) {
  console.error("CampusHire release smoke failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `CampusHire release smoke passed for ${routes.length} public routes at ${baseUrl}.`,
);
