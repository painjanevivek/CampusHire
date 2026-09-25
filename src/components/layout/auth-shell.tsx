import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicSiteHeader } from "./public-site-header";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
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
      <PublicSiteHeader actions={<Link className="authJobsLink" href="/#how-it-works">How it works</Link>} />

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
            {description ? <p className="lede">{description}</p> : null}
          </div>
          {children}
          {footer ? <p className="authFooter">{footer}</p> : null}
        </section>
      </main>
    </div>
  );
}
