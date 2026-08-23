const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "http_error",
    public readonly correlationId?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
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
  };
};

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];
}

export function apiPath(path: string): string {
  return `${apiUrl}${path}`;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ErrorBody;
    const structuredDetail = typeof body.detail === "object" ? body.detail : undefined;
    throw new ApiError(
      response.status,
      body.error?.message ?? structuredDetail?.message ??
        (typeof body.detail === "string" ? body.detail : "CampusHire could not complete this request."),
      body.error?.code ?? structuredDetail?.code ?? "http_error",
      body.error?.correlation_id ?? response.headers.get("X-Request-ID") ?? undefined,
      structuredDetail,
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
    if (!(error instanceof ApiError) || error.status !== 403 || error.message !== "CSRF validation failed") {
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
