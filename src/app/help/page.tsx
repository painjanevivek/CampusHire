import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/features/content/content-page";

export const metadata: Metadata = { title: "Help center", alternates: { canonical: "/help" } };

export default function HelpPage() {
  return <ContentPage eyebrow="Help center" title="Help when you need it." introduction="Start with the task you cannot finish. Each guide explains what CampusHire checks, which records are official, and how to continue safely." summary="Do not include contact details, passwords, access codes, or long account numbers in support messages. Use your signed-in account to manage personal records." sections={[
    { title: "Account access", body: <>Get help with invitations, sign-in, MFA, password reset, active sign-ins, and account access. <Link href="/forgot-password">Recover access</Link>.</> },
    { title: "Profile details", body: <>Complete your identity, education, skills, links, and preferences. Valid changes save automatically. <Link href="/onboarding">Open profile editor</Link>.</> },
    { title: "Eligibility and opportunities", body: "Understand published rules, missing details, deadlines, saved roles, and why you can or cannot apply." },
    { title: "Applications and appeals", body: <>Review saved application details, status history, withdrawal rules, deadlines, and appeal options. <Link href="/appeals">Read the appeals guide</Link>.</> },
    { title: "Resume and roadmap", body: "Review details found in your resume before they are used, manage saved versions, and choose a readiness path without changing eligibility." },
    { title: "Placement administration", body: "Help for student lists, invitations, companies, drives, rule publishing, application review, audit exports, and job retries." },
    { title: "Privacy, security, accessibility", body: <>Review retained data, AI boundaries, account controls, secure behavior, and accessible alternatives. <Link href="/privacy">Open privacy controls</Link>.</> },
    { title: "Still blocked?", body: <>Send a privacy-minimized request and keep the returned reference. <Link href="/help/contact">Contact support</Link>.</> },
  ]} />;
}
