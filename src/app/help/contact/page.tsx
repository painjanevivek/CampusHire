import type { Metadata } from "next";
import { ContentPage } from "@/features/content/content-page";
import { SupportForm } from "@/features/content/support-form";
export const metadata: Metadata = { title: "Contact support", alternates: { canonical: "/help/contact" } };
export default function ContactPage() { return <ContentPage eyebrow="Help center" title="Tell us what you could not finish." introduction="Send only the task, page address, and what happened. The form blocks common personal details so support can help safely." summary="CampusHire support will never ask for your password, MFA code, invitation code, or full student record." sections={[{ title: "Share only what support needs", body: <SupportForm /> }, { title: "Urgent security concern", body: "Choose Account or Other, name the page, and describe what happened. End any sign-in you do not recognize from Profile right away." }]} />; }
