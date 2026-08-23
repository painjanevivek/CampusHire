const unsafeSegment = /(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$|\?)/i;

export function safeInternalHref(value: string, fallback = "/dashboard"): string {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n\0]/.test(value) ||
    unsafeSegment.test(value)
  ) {
    return fallback;
  }
  return value;
}
