import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Security", alternates: { canonical: "/security" } };
export default function Page() { return <LegalContent document="security" />; }
