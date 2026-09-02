import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  institution_id?: string | null;
  membership_status?: string | null;
};

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) {
    return "/dashboard";
  }
  return value;
}

export async function requireServerSession(lane: "student" | "admin"): Promise<SessionUser> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const returnTo = safeReturnTo(requestHeaders.get("x-campushire-return-to"));
  const apiBase = (
    process.env.INTERNAL_API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? "http://localhost:8000/api/v1"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${apiBase}/auth/me`, {
      headers: { cookie: cookieStore.toString(), accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    redirect(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (response.status === 401) {
    const destination = lane === "admin" ? "/admin/sign-in" : "/sign-in";
    redirect(`${destination}?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (response.status === 403) {
    const body = await response.json().catch(() => ({})) as { error?: { code?: string } };
    if (body.error?.code?.startsWith("membership_")) redirect("/restricted");
    redirect("/unauthorized");
  }
  if (!response.ok) redirect(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
  const user = await response.json() as SessionUser;
  const isAdmin = user.role === "tnp_admin" || user.role === "tnp_reviewer";
  if ((lane === "admin") !== isAdmin) redirect("/unauthorized");
  return user;
}
