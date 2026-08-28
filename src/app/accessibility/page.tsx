import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Accessibility", alternates: { canonical: "/accessibility" } };
export default function Page() { return <LegalContent document="accessibility" />; }
