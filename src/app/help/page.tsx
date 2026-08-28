import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/features/content/content-page";

export const metadata: Metadata = { title: "Help center", alternates: { canonical: "/help" } };

export default function HelpPage() {
  return <ContentPage eyebrow="Help center" title="Answers at the point of work." introduction="Start with the workflow that is blocked. Each guide explains what CampusHire checks, what remains authoritative, and where to recover safely." summary="Support messages deliberately reject contact details, credentials, tokens, and long identifiers. Use the authenticated product controls for personal records." sections={[
    { title: "Account access", body: <>Invitation, sign-in, MFA, password reset, session, and restricted-membership guidance. <Link href="/forgot-password">Recover access</Link>.</> },
    { title: "Profile and evidence", body: <>Complete identity, education, skills, links, and preferences with revision-safe autosave. <Link href="/onboarding">Open profile editor</Link>.</> },
    { title: "Eligibility and opportunities", body: "Understand published criteria, missing facts, evidence sources, deadlines, saved roles, and deterministic eligibility explanations." },
    { title: "Applications and appeals", body: <>Review immutable snapshots, status history, withdrawal rules, deadlines, and appeal paths. <Link href="/appeals">Read the appeals guide</Link>.</> },
    { title: "Resume and roadmap", body: "Review extracted resume evidence before use, manage immutable versions, and select an available readiness path without affecting eligibility." },
    { title: "Placement administration", body: "Guidance for verified rosters, invitations, companies, drives, rule publication, application review, audit exports, and operational retries." },
    { title: "Privacy, security, accessibility", body: <>Review retained data, AI boundaries, account controls, secure behavior, and accessible alternatives. <Link href="/privacy">Open privacy controls</Link>.</> },
    { title: "Still blocked?", body: <>Send a privacy-minimized request and keep the returned reference. <Link href="/help/contact">Contact support</Link>.</> },
  ]} />;
}
