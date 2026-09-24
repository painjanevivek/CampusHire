import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeApiBaseUrl } from "../api/base-url";
import { safeReturnTo } from "./return-to";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  institution_id?: string | null;
  membership_status?: string | null;
  workspace?: "admin" | "tnp" | "student";
  capabilities?: string[];
  placement_access?: {
    available: boolean;
    study_year: number | null;
    academic_year_start: number | null;
    verification_required: boolean;
  } | null;
};

const TNP_ROLES = new Set(["tnp_owner", "tnp_admin", "tnp_reviewer", "tnp_auditor"]);

export function isAdministratorRole(role: string): boolean {
  return role === "platform_admin";
}

export function isTnpRole(role: string): boolean {
  return TNP_ROLES.has(role);
}

function fallbackWorkspace(user: SessionUser): "student" | "admin" | "tnp" {
  if (user.workspace) return user.workspace;
  if (isAdministratorRole(user.role)) return "admin";
  if (isTnpRole(user.role)) return "tnp";
  return "student";
}

export async function requireServerSession(lane: "student" | "admin" | "tnp"): Promise<SessionUser> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const laneHome = lane === "admin" ? "/admin/dashboard" : lane === "tnp" ? "/tnp/dashboard" : "/dashboard";
  const returnTo = safeReturnTo(
    requestHeaders.get("x-campushire-return-to"),
    laneHome,
    lane === "student" ? undefined : `/${lane}/`,
  );
  const configuredApiBase =
    process.env.INTERNAL_API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? "http://localhost:8000/api/v1";
  const apiBase = normalizeApiBaseUrl(
    configuredApiBase,
    process.env.INTERNAL_API_URL ? "INTERNAL_API_URL" : "NEXT_PUBLIC_API_URL",
  );
  let response: Response;
  try {
    response = await fetch(`${apiBase}/auth/me`, {
      headers: { cookie: cookieStore.toString(), accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    redirect(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (response.status === 401) {
    const destination = lane === "student" ? "/sign-in" : `/${lane}/sign-in`;
    redirect(`${destination}?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (response.status === 403) {
    const body = await response.json().catch(() => ({})) as { error?: { code?: string } };
    if (body.error?.code?.startsWith("membership_")) redirect("/restricted");
    redirect("/unauthorized");
  }
  if (!response.ok) redirect(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
  const user = await response.json() as SessionUser;
  const workspace = fallbackWorkspace(user);
  if (lane !== workspace) {
    if (workspace === "tnp" && returnTo.startsWith("/admin/")) {
      redirect(returnTo.replace(/^\/admin\//, "/tnp/"));
    }
    redirect(workspace === "admin" ? "/admin/dashboard" : workspace === "tnp" ? "/tnp/dashboard" : "/dashboard");
  }
  return user;
}
