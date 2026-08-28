import type { Metadata } from "next";
import { LegalContent } from "@/features/content/legal-content";
export const metadata: Metadata = { title: "Appeals", alternates: { canonical: "/appeals" } };
export default function Page() { return <LegalContent document="appeals" />; }
