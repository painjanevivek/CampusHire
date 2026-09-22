import type { Metadata } from "next";

import { EditorialLanding } from "@/features/marketing/editorial-landing";

export const metadata: Metadata = {
  title: "Accountable campus recruitment",
  description:
    "CampusHire connects student evidence, published eligibility rules, applications, and human placement review in one accountable record.",
  openGraph: {
    title: "CampusHire — accountable campus recruitment",
    description:
      "One clear record for student preparation, eligibility, applications, and placement-team review.",
  },
};

export default function HomePage() {
  return <EditorialLanding />;
}
