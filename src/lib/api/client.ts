const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(response.status, body.detail ?? "CampusHire could not complete this request.");
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
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  headers.set("X-CSRF-Token", decodeURIComponent(token));
  return apiRequest<T>(path, {
    ...init,
    headers,
  });
}
