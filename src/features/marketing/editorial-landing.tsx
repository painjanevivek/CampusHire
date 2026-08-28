import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, FileCheck2, LockKeyhole, Route, Scale, ShieldCheck, UserCheck } from "lucide-react";

import styles from "./editorial-landing.module.css";

const journey = [
  ["01", "Accept invitation", "Use the one-time invitation issued by your institution."],
  ["02", "Build verified profile", "Add the academic facts and evidence used by published rules."],
  ["03", "Understand eligibility", "See every pass, fail, and missing fact separately from role match."],
  ["04", "Apply confidently", "Choose a reviewed resume version and track the complete decision history."],
];

export function EditorialLanding() {
  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home"><span aria-hidden="true">C</span><strong>CampusHire</strong></Link>
        <nav aria-label="Primary navigation"><a href="#how-it-works">How it works</a><a href="#preview">Product preview</a><a href="#trust">Trust</a><a href="#faq">FAQ</a></nav>
        <div className={styles.headerActions}><Link href="/sign-in">Student sign in</Link><Link href="/admin/sign-in">T&amp;P access</Link></div>
      </div></header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="landing-title">
          <div><p className={styles.eyebrow}>Institution-verified campus hiring</p><h1 id="landing-title">Accept your institution invitation. Apply with evidence.</h1><p>CampusHire gives students one clear next step, explains formal eligibility line by line, and keeps every application tied to the evidence and policy used at submission.</p>
            <div className={styles.heroActions}><Link href="/sign-up">Accept invitation <ArrowRight size={18} aria-hidden="true" /></Link><Link href="/sign-in">I already have an account</Link></div>
            <small><LockKeyhole size={15} aria-hidden="true" /> Opportunities stay private to verified members of participating institutions.</small>
          </div>
          <aside aria-label="Activation expectations"><p>Before you begin</p><strong>About 12 minutes</strong><span>Have your enrolment details, academic record, target role, and optional PDF resume ready.</span><dl><div><dt>Required</dt><dd>Identity · education · target role</dd></div><div><dt>Unlocks</dt><dd>Eligibility · roadmaps · applications</dd></div></dl></aside>
        </section>

        <section className={styles.journey} id="how-it-works" aria-labelledby="journey-title"><header><p>How it works</p><h2 id="journey-title">A guided path from invitation to application.</h2></header><ol>{journey.map(([number, title, description]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>

        <section className={styles.preview} id="preview" aria-label="Product preview"><header><p>Illustrative product preview</p><h2>Know where you stand—and why.</h2><span>Example data only. Your workspace is institution-scoped and private.</span></header><div className={styles.previewGrid}>
          <article className={styles.nextAction}><p>Primary next action · 6 min</p><Route aria-hidden="true" /><h3>Review extracted resume evidence</h3><span>Confirm each proposed fact before it can support an application.</span><strong>Unlocks: a selectable resume version</strong></article>
          <article><p>Eligibility</p><BadgeCheck aria-hidden="true" /><h3>Eligible</h3><ul><li>CGPA threshold <strong>Passed</strong></li><li>Graduation year <strong>Passed</strong></li><li>Active backlogs <strong>Passed</strong></li></ul></article>
          <article><p>Opportunity</p><Building2 aria-hidden="true" /><h3>Graduate Software Engineer</h3><span>Pune · Hybrid · Apply by 18 Sep</span><small>Role match 82% · advisory only</small></article>
          <article><p>Roadmap</p><FileCheck2 aria-hidden="true" /><h3>Software engineering</h3><span>3 of 8 milestones complete</span><strong>Next: Ship a tested API</strong></article>
        </div></section>

        <section className={styles.trust} id="trust" aria-labelledby="trust-title"><header><p>Trust by design</p><h2 id="trust-title">Evidence before scores.</h2></header><div className={styles.trustGrid}>
          <article><BadgeCheck aria-hidden="true" /><h3>Formal eligibility</h3><p>Published institutional rules are checked deterministically and shown line by line.</p></article>
          <article><Scale aria-hidden="true" /><h3>Role match</h3><p>Reviewed skills and projects explain relevance only after eligibility.</p><strong>A match score never decides formal eligibility.</strong></article>
          <article><ShieldCheck aria-hidden="true" /><h3>Privacy and control</h3><p>AI cannot silently publish claims. Students review evidence and every private download is authorized.</p></article>
        </div></section>

        <section className={styles.audiences}><article><UserCheck aria-hidden="true" /><div><p>For students</p><h2>Less guessing. Better applications.</h2><span>See what remains, what it unlocks, and the exact evidence attached to every application.</span><Link href="/sign-in">Open student sign in</Link></div></article><article><Building2 aria-hidden="true" /><div><p>For training &amp; placement</p><h2>Governed operations at institution scale.</h2><span>Publish auditable rules, manage verified memberships, and review decisions without opaque ranking.</span><Link href="/admin/sign-in">Open T&amp;P sign in</Link></div></article></section>

        <section className={styles.faq} id="faq" aria-labelledby="faq-title"><p>Common questions</p><h2 id="faq-title">The important details, up front.</h2><details><summary>Can anyone browse campus opportunities?</summary><p>No. Roles are private to active, verified members of the publishing institution.</p></details><details><summary>Does AI decide whether I am eligible?</summary><p>No. Formal eligibility uses versioned deterministic rules. AI-assisted match evidence is separate, advisory, and can be unavailable without blocking core workflows.</p></details><details><summary>What happens after my profile changes?</summary><p>A submitted application keeps immutable references to its resume, profile facts, eligibility result, and rule version.</p></details></section>
      </main>

      <footer className={styles.footer}><div><strong>CampusHire</strong><span>Student-first campus recruitment</span></div><nav aria-label="Footer"><Link href="/privacy">Privacy and AI assistance</Link><Link href="/sign-in">Student sign in</Link><Link href="/admin/sign-in">T&amp;P access</Link></nav><p>AI supports decisions. Deterministic rules and accountable people remain authoritative.</p></footer>
    </div>
  );
}
