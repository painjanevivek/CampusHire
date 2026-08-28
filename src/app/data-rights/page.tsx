import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Data rights", alternates: { canonical: "/data-rights" } };
export default function Page() { return <LegalContent document="data-rights" />; }
