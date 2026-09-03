import { normalizeApiBaseUrl } from "./base-url";

const apiUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  "NEXT_PUBLIC_API_URL",
);

export type ApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "validation"
  | "conflict"
  | "rate-limit"
  | "dependency"
  | "server"
  | "offline"
  | "timeout";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "http_error",
    public readonly correlationId?: string,
    public readonly details?: Record<string, unknown>,
    public readonly kind: ApiErrorKind = ApiError.kindForStatus(status),
  ) {
    super(message);
    this.name = "ApiError";
  }

  static kindForStatus(status: number): ApiErrorKind {
    if (status === 401) return "unauthenticated";
    if (status === 403) return "forbidden";
    if (status === 409) return "conflict";
    if (status === 422) return "validation";
    if (status === 429) return "rate-limit";
    if (status === 502 || status === 503 || status === 504) return "dependency";
    return "server";
  }

  static fromStatus(status: number, message: string, code = "http_error") {
    return new ApiError(status, message, code);
  }
}

function isRequestTimeout(cause: unknown): boolean {
  if (typeof cause !== "object" || cause === null || !("name" in cause)) return false;
  const name = Reflect.get(cause, "name");
  return name === "AbortError" || name === "TimeoutError";
}

type ErrorBody = {
  detail?: string | {
    code?: string;
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code?: string;
    message?: string;
    correlation_id?: string;
    details?: Record<string, unknown>;
  };
};

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];
}

export function apiPath(path: string): string {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\r\n]/.test(path) ||
    /(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$|\?)/i.test(path)
  ) {
    throw new Error("API paths must be safe relative paths.");
  }
  return `${apiUrl}${path}`;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  let response: Response;
  try {
    response = await fetch(apiPath(path), {
      ...init,
      credentials: "include",
      headers,
      redirect: "error",
      signal: init?.signal ?? AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    if (isRequestTimeout(cause)) {
      throw new ApiError(0, "The request timed out. Try again.", "request_timeout", undefined, undefined, "timeout");
    }
    throw new ApiError(0, "You appear to be offline. Reconnect and try again.", "offline", undefined, undefined, "offline");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ErrorBody;
    const structuredDetail = typeof body.detail === "object" ? body.detail : undefined;
    throw new ApiError(
      response.status,
      body.error?.message ?? structuredDetail?.message ??
        (typeof body.detail === "string" ? body.detail : "CampusHire could not complete this request."),
      body.error?.code ?? structuredDetail?.code ?? "http_error",
      body.error?.correlation_id ?? response.headers.get("X-Request-ID") ?? undefined,
      body.error?.details ?? structuredDetail,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function csrfRequest<T>(path: string, init: RequestInit): Promise<T> {
  let token = cookie("campushire_csrf");
  if (!token) {
    await apiRequest<void>("/auth/csrf");
    token = cookie("campushire_csrf");
  }
  if (!token) throw new Error("CampusHire could not start a secure form session.");

  const send = (csrfToken: string) => {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
    headers.set("X-CSRF-Token", decodeURIComponent(csrfToken));
    return apiRequest<T>(path, { ...init, headers });
  };

  try {
    return await send(token);
  } catch (error) {
    if (
      !(error instanceof ApiError)
      || error.status !== 403
      || (error.code !== "csrf_validation_failed" && error.message !== "CSRF validation failed")
    ) {
      throw error;
    }
    await apiRequest<void>("/auth/csrf", { cache: "no-store" });
    const refreshedToken = cookie("campushire_csrf");
    if (!refreshedToken) {
      throw new Error("CampusHire could not refresh the secure form session.");
    }
    return send(refreshedToken);
  }
}
