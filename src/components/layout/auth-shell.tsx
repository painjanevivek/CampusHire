import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main id="main-content" className="authPage">
      <Link className="brand" href="/"><span className="brandMark" aria-hidden="true">C</span><span>CampusHire AI</span></Link>
      <section className="authPanel" aria-labelledby="auth-title">
        <div><p className="eyebrow">{eyebrow}</p><h1 id="auth-title">{title}</h1><p className="lede">{description}</p></div>
        {children}
        <p className="authFooter">{footer}</p>
      </section>
      <aside className="authPromise"><p className="pathLabel">Student-first by design</p><blockquote>“Your profile helps explain your fit. It never gives AI permission to invent your story.”</blockquote><p>No OTP is used in this pilot. Your password is protected with Argon2id and your session stays out of browser storage.</p></aside>
    </main>
  );
}
