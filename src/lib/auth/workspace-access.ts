const OFFICER_ROLES = new Set(["tnp_owner", "tnp_admin"]);

const REVIEWER_ROUTES = [
  "/tnp/dashboard",
  "/tnp/applications",
  "/tnp/policies",
  "/tnp/account",
] as const;

const AUDITOR_ROUTES = [
  "/tnp/reports",
  "/tnp/audit",
  "/tnp/account",
] as const;

function routeMatches(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function tnpHomeForRole(role: string): string {
  if (role === "tnp_auditor") return "/tnp/reports";
  if (role === "tnp_reviewer") return "/tnp/dashboard";
  return OFFICER_ROLES.has(role) ? "/tnp/dashboard" : "/unauthorized";
}

export function canAccessTnpPath(role: string, pathname: string): boolean {
  if (!pathname.startsWith("/tnp/")) return false;
  if (OFFICER_ROLES.has(role)) return true;
  if (role === "tnp_reviewer") {
    return REVIEWER_ROUTES.some((route) => routeMatches(pathname, route));
  }
  if (role === "tnp_auditor") {
    return AUDITOR_ROUTES.some((route) => routeMatches(pathname, route));
  }
  return false;
}
