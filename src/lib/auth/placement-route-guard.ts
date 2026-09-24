const placementRoutePrefixes = [
  "/dashboard",
  "/opportunities",
  "/applications",
  "/preparation",
  "/copilot",
  "/roadmap",
  "/resume",
];

export function requiresPlacementAccess(pathname: string): boolean {
  return placementRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
