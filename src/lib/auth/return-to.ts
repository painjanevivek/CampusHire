const RETURN_TO_BASE = "https://campushire.invalid";
const UNSAFE_RETURN_TO = /[\\\r\n]|%(?:0a|0d|5c)/i;
const DOT_SEGMENT = /(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$)/i;

export function safeReturnTo(
  value: string | null | undefined,
  fallback: string,
  allowedPathPrefix?: string,
): string {
  if (
    !value
    || !value.startsWith("/")
    || value.startsWith("//")
    || UNSAFE_RETURN_TO.test(value)
    || DOT_SEGMENT.test(value.split(/[?#]/, 1)[0] ?? "")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, RETURN_TO_BASE);
    if (
      parsed.origin !== RETURN_TO_BASE
      || parsed.hash
      || (allowedPathPrefix && !parsed.pathname.startsWith(allowedPathPrefix))
    ) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
