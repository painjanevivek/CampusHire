import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeApiBaseUrl } from "@/lib/api/base-url";

type StudentOnboardingStatus = { completed: boolean };

export async function getStudentOnboardingStatus(): Promise<StudentOnboardingStatus> {
  const cookieStore = await cookies();
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
    response = await fetch(`${apiBase}/onboarding`, {
      headers: { cookie: cookieStore.toString(), accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    redirect("/offline?returnTo=%2Fonboarding");
  }

  if (!response.ok) redirect("/offline?returnTo=%2Fonboarding");
  return await response.json() as StudentOnboardingStatus;
}
