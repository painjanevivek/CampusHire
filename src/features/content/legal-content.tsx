import { ContentPage, type ContentSection } from "./content-page";

type DocumentKey = "terms" | "accessibility" | "security" | "acceptable-use" | "data-rights" | "appeals";

const documents: Record<DocumentKey, { title: string; introduction: string; summary: string; sections: ContentSection[] }> = {
  terms: { title: "Terms of service", introduction: "These rules help keep college placement work fair, reliable, and clear.", summary: "CampusHire supports verified hiring. Your institution is still responsible for official eligibility and placement decisions.", sections: [
    { title: "Using CampusHire", body: "Use only your own verified account and keep your sign-in details private. Approved placement administrators give and remove staff access." },
    { title: "Official decisions", body: "Published rules, verified student records, and saved administrator actions are official. AI can explain why a role may match, but it never decides eligibility." },
    { title: "Availability and changes", body: "We may carry out maintenance, improve features, or stop unsafe activity. Important service updates appear on the status page and inside CampusHire." },
    { title: "Account closure", body: "Access may end when enrollment, employment, or permission from your institution ends. Eligible students may request data deletion through the privacy controls." },
  ]},
  accessibility: { title: "Accessibility statement", introduction: "CampusHire is designed for keyboard, screen-reader, zoom, contrast, and reduced-motion use.", summary: "If you cannot finish a task, report the page and task—not personal records—through the Help center.", sections: [
    { title: "Our standard", body: "We target WCAG 2.2 AA across student, administrator, authentication, and public guidance experiences." },
    { title: "Supported interaction", body: "Core tasks support visible focus, semantic headings and labels, keyboard operation, 400% reflow, status announcements, and reduced-motion preferences." },
    { title: "Known limitations", body: "Complex imported documents can vary in accessibility. CampusHire provides structured review screens so users are not required to rely on a generated document preview." },
    { title: "Request assistance", body: "Use Help center → Accessibility and describe the blocked task. Do not include email addresses, enrollment numbers, resumes, passwords, or tokens." },
  ]},
  security: { title: "Security at CampusHire", introduction: "Several security checks protect each institution, verified records, active sign-ins, and sensitive placement actions.", summary: "Security and account messages cannot be turned off. CampusHire never asks you to send a password or one-time code to support.", sections: [
    { title: "Identity and sign-ins", body: "Passwords are strongly protected, administrator access requires MFA, every sign-in can be ended, and sensitive bulk actions require a recent identity check." },
    { title: "Keeping institutions separate", body: "CampusHire gets your institution from your secure signed-in session. A value sent by the browser cannot give access to another institution." },
    { title: "Files and AI limits", body: "Uploads are checked for file type, size, and malware. AI suggestions stay separate from official eligibility and application decisions." },
    { title: "Report a concern", body: "Choose Security in the Help center. Share the page and what you saw, but never send passwords, student records, or attack details that contain personal information." },
  ]},
  "acceptable-use": { title: "Acceptable use", introduction: "Clear rules protect students, institutions, and placement records.", summary: "Do not use CampusHire to mislead people, discriminate, copy private records, disrupt the service, or bypass security controls.", sections: [
    { title: "Fair participation", body: "Provide correct information, follow published deadlines, and do not pretend to be another student, administrator, institution, or employer." },
    { title: "Responsible administration", body: "Apply published rules in the same way for everyone, record reasons for important changes, and use exports only for approved placement work." },
    { title: "Prohibited automation", body: "Do not enumerate accounts, bulk extract records, probe other institutions, overwhelm endpoints, or automate decisions that CampusHire reserves for accountable human review." },
    { title: "Enforcement", body: "Unsafe activity may be rate-limited, suspended, investigated, and recorded in the audit trail. Institutions can appeal disputed actions through the documented process." },
  ]},
  "data-rights": { title: "Your data rights", introduction: "Understand, correct, export, object to, or request deletion of eligible personal data.", summary: "The privacy workspace is the safest starting point because it verifies your session and records the request without exposing data to support messages.", sections: [
    { title: "View and export your data", body: "Review your profile and application records in CampusHire. Available exports use safe, organized file formats." },
    { title: "Correction", body: "Students can correct editable profile details. For records verified by the institution, the placement office may need to keep a clear history of changes." },
    { title: "Deletion and how long data is kept", body: "You can ask us to delete data that can be removed. Legal, security, audit, or active placement needs may require us to keep some records for a stated time." },
    { title: "Questions and objections", body: "Open the privacy controls or submit a non-PII Help request under Privacy. CampusHire provides a reference you can use for follow-up." },
  ]},
  appeals: { title: "Appeals and corrections", introduction: "Important placement results need a clear way to report missing facts or mistakes.", summary: "An appeal does not replace the old record. It adds a new record linked to the original application decision.", sections: [
    { title: "When to appeal", body: "Appeal when verified information was missing, a published rule may have been applied incorrectly, or the saved status does not match the result you received." },
    { title: "What to include", body: "Choose the application and the closest appeal reason, then explain the correction using information already in CampusHire. Never share sign-in details." },
    { title: "Review process", body: "An approved placement reviewer saves the result and reason. Any manual change stays clear and keeps the original decision history." },
    { title: "Further support", body: "If you cannot use the appeal option inside an application, choose Eligibility or Application in the Help center. Describe the page and issue without personal details." },
  ]},
};

export function LegalContent({ document }: { document: DocumentKey }) {
  const content = documents[document];
  return <ContentPage eyebrow="CampusHire policy" {...content} />;
}
