export function staffMfaSetupPath(workspace: "admin" | "tnp" | "student" | undefined, nextPath?: string): string {
  const base = workspace === "tnp" ? "/tnp/mfa/setup" : "/admin/mfa/setup";
  return nextPath ? `${base}?next=${encodeURIComponent(nextPath)}` : base;
}
