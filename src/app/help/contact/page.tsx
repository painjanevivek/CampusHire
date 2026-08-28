import type { Metadata } from "next";
import { ContentPage } from "@/features/content/content-page";
import { SupportForm } from "@/features/content/support-form";
export const metadata: Metadata = { title: "Contact support", alternates: { canonical: "/help/contact" } };
export default function ContactPage() { return <ContentPage eyebrow="Help center" title="Describe the blocked task." introduction="Send only the workflow, route, and observable behavior. The form refuses common personal identifiers so support can start safely." summary="CampusHire support will never request your password, MFA code, activation token, or full student record." sections={[{ title: "Privacy-minimized request", body: <SupportForm /> }, { title: "Urgent security concern", body: "Choose Account or Other, name the affected route, and describe the behavior. Revoke unfamiliar sessions from Profile immediately." }]} />; }
