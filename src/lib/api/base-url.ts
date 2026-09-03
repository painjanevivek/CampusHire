const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function normalizeApiBaseUrl(value: string, variableName: string): string {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${variableName} must be an HTTP(S) URL without credentials.`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`${variableName} cannot contain a query or fragment.`);
  }
  if (parsed.protocol === "http:" && !LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`${variableName} must use HTTPS unless it targets the local loopback interface.`);
  }
  return parsed.toString().replace(/\/$/, "");
}
