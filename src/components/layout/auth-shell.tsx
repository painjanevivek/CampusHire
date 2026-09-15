import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  context?: "student" | "admin";
  wide?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  context = "student",
  wide = false,
  backHref,
  backLabel = "Back",
}: AuthShellProps) {
  return (
    <div className="authShell" data-auth-context={context}>
      <header className="authHeader">
        <Link className="brand" href="/" aria-label="CampusHire home">
          <BrandMark className="brandMark" />
          <span>CampusHire</span>
        </Link>
        <Link className="authJobsLink" href="/#how-it-works">How it works</Link>
      </header>

      <main
        id="main-content"
        className={`authPage authPage--centered${wide ? " authPage--wide" : ""}`}
      >
        <section className="authPanel" aria-labelledby="auth-title">
          {backHref ? (
            <Link className="authBackLink" href={backHref}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          ) : null}
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            <p className="lede">{description}</p>
          </div>
          {children}
          <p className="authFooter">{footer}</p>
        </section>
      </main>
    </div>
  );
}
