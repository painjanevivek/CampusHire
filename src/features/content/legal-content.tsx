import { ContentPage, type ContentSection } from "./content-page";

type DocumentKey = "terms" | "accessibility" | "security" | "acceptable-use" | "data-rights" | "appeals";

const documents: Record<DocumentKey, { title: string; introduction: string; summary: string; sections: ContentSection[] }> = {
  terms: { title: "Terms of service", introduction: "The rules that keep institutional placement workflows fair, reliable, and accountable.", summary: "CampusHire supports verified recruitment workflows. Your institution remains responsible for official eligibility and placement decisions.", sections: [
    { title: "Using CampusHire", body: "Use the service only through your own verified account and keep access credentials private. Institutional roles are granted and revoked by authorized placement administrators." },
    { title: "Authoritative decisions", body: "Published criteria, verified student records, and recorded administrator actions are authoritative. AI-assisted relevance signals are explanatory aids, never eligibility decisions." },
    { title: "Availability and changes", body: "We may perform maintenance, improve features, or restrict unsafe activity. Material service states are communicated through the status page and in-product notices." },
    { title: "Account closure", body: "Access may end when enrollment, employment, or institutional authority ends. Eligible students may request data deletion through the privacy controls." },
  ]},
  accessibility: { title: "Accessibility statement", introduction: "CampusHire is designed for keyboard, screen-reader, zoom, contrast, and reduced-motion use.", summary: "If a workflow creates a barrier, report the page and task—not personal records—through the help center.", sections: [
    { title: "Our standard", body: "We target WCAG 2.2 AA across student, administrator, authentication, and public guidance experiences." },
    { title: "Supported interaction", body: "Core tasks support visible focus, semantic headings and labels, keyboard operation, 400% reflow, status announcements, and reduced-motion preferences." },
    { title: "Known limitations", body: "Complex imported documents can vary in accessibility. CampusHire provides structured review screens so users are not required to rely on a generated document preview." },
    { title: "Request assistance", body: "Use Help center → Accessibility and describe the blocked task. Do not include email addresses, enrollment numbers, resumes, passwords, or tokens." },
  ]},
  security: { title: "Security at CampusHire", introduction: "Layered controls protect tenant boundaries, verified records, sessions, and sensitive placement actions.", summary: "Security and account messages cannot be disabled. CampusHire never asks you to send a password or one-time token to support.", sections: [
    { title: "Identity and sessions", body: "Passwords are strongly hashed, administrator access requires MFA, sessions are revocable, and sensitive bulk actions require recent verification." },
    { title: "Institution isolation", body: "Institution identity is derived from the authenticated server session. Browser-supplied tenant identifiers never authorize access." },
    { title: "Files and AI boundaries", body: "Uploads are type, size, and malware checked. AI suggestions are isolated from authoritative eligibility and application decisions." },
    { title: "Report a concern", body: "Use the help center with the Security category. Share the affected route and observable behavior, but never credentials, student records, or exploit data containing personal information." },
  ]},
  "acceptable-use": { title: "Acceptable use", introduction: "Clear boundaries protect students, institutions, and the integrity of placement records.", summary: "Do not use CampusHire to deceive, discriminate, scrape private records, disrupt service, or bypass access controls.", sections: [
    { title: "Fair participation", body: "Provide truthful evidence, follow published deadlines, and do not impersonate another student, administrator, institution, or employer." },
    { title: "Responsible administration", body: "Apply documented criteria consistently, record reasons for consequential changes, and use exports only for authorized placement work." },
    { title: "Prohibited automation", body: "Do not enumerate accounts, bulk extract records, probe other institutions, overwhelm endpoints, or automate decisions that CampusHire reserves for accountable human review." },
    { title: "Enforcement", body: "Unsafe activity may be rate-limited, suspended, investigated, and recorded in the audit trail. Institutions can appeal disputed actions through the documented process." },
  ]},
  "data-rights": { title: "Your data rights", introduction: "Understand, correct, export, object to, or request deletion of eligible personal data.", summary: "The privacy workspace is the safest starting point because it verifies your session and records the request without exposing data to support messages.", sections: [
    { title: "Access and portability", body: "Review your profile and application records in product. Available exports use structured, formula-safe formats." },
    { title: "Correction", body: "Students can correct editable profile evidence. Institution-verified records may require the placement office to preserve an accountable revision history." },
    { title: "Deletion and retention", body: "Eligible data can be requested for deletion. Legal, security, audit, or active-placement obligations may require limited records to be retained for a documented period." },
    { title: "Questions and objections", body: "Open the privacy controls or submit a non-PII Help request under Privacy. CampusHire provides a reference you can use for follow-up." },
  ]},
  appeals: { title: "Appeals and corrections", introduction: "Consequential placement outcomes need a clear, reviewable path to challenge missing facts or process errors.", summary: "An appeal does not overwrite history. It creates a new accountable record linked to the original application decision.", sections: [
    { title: "When to appeal", body: "Appeal when verified evidence was missing, a published rule appears misapplied, or a recorded status does not match the communicated outcome." },
    { title: "What to include", body: "Identify the application, choose the closest appeal reason, and explain the correction with relevant evidence already present in CampusHire. Never share credentials." },
    { title: "Review process", body: "An authorized placement reviewer records the outcome and rationale. Overrides remain explicit and preserve the original decision history." },
    { title: "Further support", body: "If the in-application appeal control is unavailable, use the Help center category Eligibility or Application and describe the route and issue without personal identifiers." },
  ]},
};

export function LegalContent({ document }: { document: DocumentKey }) {
  const content = documents[document];
  return <ContentPage eyebrow="CampusHire policy" {...content} />;
}
