import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  FileCheck2,
  HelpCircle,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Docs",
  description: "A clear guide to CampusHire for students and training and placement teams.",
  alternates: { canonical: "/docs" },
};

const studentSteps = [
  ["Accept your invitation", "Use the private link sent by your college. Invitations can be used only once."],
  ["Complete your profile", "Add your education, skills, target role, and any optional links you want to share."],
  ["Review your resume", "Check every detail found in your PDF before CampusHire uses it in an application."],
  ["Check opportunities", "See which published rules you meet, which details are missing, and why a role may suit you."],
  ["Apply and track", "Choose a reviewed resume, apply before the deadline, and follow every status change."],
];

const adminTools = [
  ["Invite students", "Add verified members with clear access states and safe roster checks."],
  ["Publish drives", "Create roles, add eligibility rules, test them, and publish a locked version."],
  ["Review applications", "See rule results, student details, status history, and requests for human review."],
  ["Keep a clear history", "Sensitive changes record who acted, what changed, and why."],
];

export default function DocsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandGroup}>
            <Link className={styles.brand} href="/" aria-label="CampusHire home">
              <span aria-hidden="true">C</span>
              <strong>CampusHire</strong>
            </Link>
            <span className={styles.docsLabel}>Docs</span>
          </div>
          <nav aria-label="Docs actions">
            <Link href="/help">Help</Link>
            <Link href="/sign-in">Student sign in</Link>
            <Link className={styles.adminLink} href="/admin/sign-in">T&amp;P access</Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="docs-title">
          <div>
            <p className={styles.eyebrow}><BookOpen size={16} aria-hidden="true" /> CampusHire guide</p>
            <h1 id="docs-title">Understand CampusHire before you start.</h1>
            <p>Learn what the website does, how each step works, and which choices stay with you or your college.</p>
          </div>
          <div className={styles.startCard}>
            <p>Start here</p>
            <strong>Choose the guide for your role.</strong>
            <div>
              <a href="#students"><UserCheck aria-hidden="true" /> I am a student</a>
              <a href="#tp-teams"><Building2 aria-hidden="true" /> I work in T&amp;P</a>
            </div>
          </div>
        </section>

        <div className={styles.docsLayout}>
          <aside className={styles.sideNav} aria-label="On this page">
            <p>On this page</p>
            <a href="#about">What CampusHire does</a>
            <a href="#students">Student guide</a>
            <a href="#tp-teams">T&amp;P guide</a>
            <a href="#decisions">Eligibility and role match</a>
            <a href="#privacy">Privacy and safety</a>
            <a href="#help">Get help</a>
          </aside>

          <article className={styles.content}>
            <section id="about" aria-labelledby="about-title">
              <p className={styles.sectionLabel}>The website</p>
              <h2 id="about-title">Campus hiring with fewer surprises.</h2>
              <p className={styles.lede}>CampusHire gives students and placement teams one shared place for profiles, opportunities, applications, and clear decision history.</p>
              <div className={styles.valueGrid}>
                <article><BadgeCheck aria-hidden="true" /><h3>Clear eligibility</h3><p>Published college rules are shown one by one, with a reason for every result.</p></article>
                <article><FileCheck2 aria-hidden="true" /><h3>Reviewed resumes</h3><p>Students check details found in a resume before those details can be used.</p></article>
                <article><Scale aria-hidden="true" /><h3>Human control</h3><p>AI may help explain a match. It never makes the official eligibility decision.</p></article>
              </div>
            </section>

            <section id="students" aria-labelledby="students-title">
              <p className={styles.sectionLabel}>For students</p>
              <h2 id="students-title">From invitation to application.</h2>
              <ol className={styles.steps}>
                {studentSteps.map(([title, description], index) => (
                  <li key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{title}</h3><p>{description}</p></div>
                  </li>
                ))}
              </ol>
              <Link className={styles.textLink} href="/sign-up">Learn how invitations work <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>

            <section id="tp-teams" aria-labelledby="tp-title">
              <p className={styles.sectionLabel}>For training and placement</p>
              <h2 id="tp-title">Tools for careful, consistent placement work.</h2>
              <div className={styles.adminGrid}>
                {adminTools.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
              </div>
              <Link className={styles.textLink} href="/admin/sign-in">Open T&amp;P sign in <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>

            <section id="decisions" aria-labelledby="decisions-title">
              <p className={styles.sectionLabel}>How decisions work</p>
              <h2 id="decisions-title">Eligibility and role match are different.</h2>
              <div className={styles.decisionGrid}>
                <article>
                  <BadgeCheck aria-hidden="true" />
                  <p>Official check</p>
                  <h3>Eligibility</h3>
                  <span>Published rules decide whether you can apply. Missing information goes to a person for review instead of causing a hidden rejection.</span>
                </article>
                <article>
                  <Scale aria-hidden="true" />
                  <p>Helpful guide</p>
                  <h3>Role match</h3>
                  <span>Your reviewed skills and projects may explain why a role suits you. This score cannot change eligibility.</span>
                </article>
              </div>
            </section>

            <section id="privacy" aria-labelledby="privacy-title">
              <p className={styles.sectionLabel}>Privacy and safety</p>
              <h2 id="privacy-title">Your information stays inside clear limits.</h2>
              <ul className={styles.safetyList}>
                <li><LockKeyhole aria-hidden="true" /><div><strong>Private college spaces</strong><span>Students see only roles shared with their verified college.</span></div></li>
                <li><ShieldCheck aria-hidden="true" /><div><strong>Protected files</strong><span>Uploads are checked for file type, size, and malware before use.</span></div></li>
                <li><UserCheck aria-hidden="true" /><div><strong>You review AI suggestions</strong><span>CampusHire cannot add resume claims without student approval.</span></div></li>
              </ul>
              <Link className={styles.textLink} href="/privacy">Read about privacy and AI <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>

            <section className={styles.helpCard} id="help" aria-labelledby="help-title">
              <HelpCircle aria-hidden="true" />
              <div><p className={styles.sectionLabel}>Need help?</p><h2 id="help-title">Start with the task you cannot finish.</h2><span>The Help center explains account access, profiles, applications, appeals, and safe ways to contact support.</span></div>
              <Link href="/help">Open Help center <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>
          </article>
        </div>
      </main>

      <footer className={styles.footer}>
        <Link href="/">CampusHire</Link>
        <span>Clear campus hiring for students and placement teams.</span>
      </footer>
    </div>
  );
}
