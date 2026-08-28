import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Acceptable use", alternates: { canonical: "/acceptable-use" } };
export default function Page() { return <LegalContent document="acceptable-use" />; }
