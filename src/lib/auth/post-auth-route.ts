const INSTITUTION_ONBOARDING_MFA_PATH = "/admin/mfa/setup?next=%2Fadmin%2Fonboarding";

export function adminMfaSetupPath(role: string): string {
  return role === "tnp_owner" ? INSTITUTION_ONBOARDING_MFA_PATH : "/admin/mfa/setup";
}
