import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Terms of service", alternates: { canonical: "/terms" } };
export default function Page() { return <LegalContent document="terms" />; }
