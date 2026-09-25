import type { Metadata } from "next";
import { cookies } from "next/headers";

import { EditorialLanding } from "@/features/marketing/editorial-landing";

export const metadata: Metadata = {
  title: "Accountable campus recruitment",
  description:
    "CampusHire connects student profiles, published eligibility rules, applications, and human placement review in one accountable record.",
  openGraph: {
    title: "CampusHire — accountable campus recruitment",
    description:
      "One clear record for student preparation, eligibility, applications, and placement-team review.",
  },
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookiePresent = Boolean(cookieStore.get("campushire_session")?.value);
  return <EditorialLanding sessionCookiePresent={sessionCookiePresent} />;
}
