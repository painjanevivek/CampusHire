import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  context?: "student" | "admin";
};

const principles = {
  student: {
    label: "Student-first by design",
    statement: "Your profile helps explain your fit. It never gives AI permission to invent your story.",
    detail: "Your eligibility comes from published college rules. Match guidance stays separate and every session can be ended without storing access tokens in the browser.",
  },
  admin: {
    label: "Placement records stay accountable",
    statement: "Review decisions remain human, traceable, and separate from AI-assisted guidance.",
    detail: "T&P access is invitation-only, requires an authenticator after the password, and keeps student records scoped to the assigned institution.",
  },
} as const;

export function AuthShell({ eyebrow, title, description, children, footer, context = "student" }: AuthShellProps) {
  const promise = principles[context];

  return (
    <div className="authShell" data-auth-context={context}>
      <header className="authHeader">
        <Link className="brand" href="/" aria-label="CampusHire home">
          <BrandMark className="brandMark" />
          <span>CampusHire</span>
        </Link>
        <Link className="authJobsLink" href="/#how-it-works">How it works</Link>
      </header>

      <main id="main-content" className="authPage">
        <section className="authPanel" aria-labelledby="auth-title">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            <p className="lede">{description}</p>
          </div>
          {children}
          <p className="authFooter">{footer}</p>
        </section>

        <aside className="authPromise" aria-label="CampusHire principles">
          <p className="pathLabel">{promise.label}</p>
          <blockquote>{promise.statement}</blockquote>
          <p>{promise.detail}</p>
        </aside>
      </main>
    </div>
  );
}
