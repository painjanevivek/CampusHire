"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Route,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { trackProductEvent } from "@/lib/product-analytics";
import { useLandingMotion } from "./landing-motion";
import styles from "./editorial-landing.module.css";

const explanations = [
  {
    id: "eligibility",
    title: "Formal eligibility",
    body: "Typed placement rules check grades, backlogs, graduation year, and required evidence. Missing information becomes review, not a hidden rejection.",
  },
  {
    id: "match",
    title: "Role match",
    body: "Semantic matching compares approved role requirements with reviewed student evidence. It supports exploration after eligibility is decided.",
  },
  {
    id: "resume",
    title: "Reviewed resume improvements",
    body: "AI can suggest clearer wording, but a student accepts every change. CampusHire never invents grades, outcomes, employers, or credentials.",
  },
];

const careerPaths = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Mobile Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "AI Engineer",
];

const principles = [
  {
    title: "You confirm the evidence",
    body: "Extracted profile details and resume suggestions stay reviewable before they become part of your placement story.",
  },
  {
    title: "Rules stay accountable",
    body: "Eligibility keeps the exact rule version and explanation used for the decision. Match remains a separate signal.",
  },
  {
    title: "Your next move stays practical",
    body: "A curated roadmap turns gaps into one focused action, with progress confirmed by the student.",
  },
];

export function EditorialLanding() {
  const root = useRef<HTMLElement>(null);
  const [openExplanation, setOpenExplanation] = useState("eligibility");
  const [principle, setPrinciple] = useState(0);
  useLandingMotion(root);

  function movePrinciple(direction: -1 | 1) {
    setPrinciple((current) => (current + direction + principles.length) % principles.length);
  }

  return (
    <main id="main-content" className={styles.page} ref={root}>
      <nav className={styles.navigation} aria-label="Primary navigation">
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <span aria-hidden="true">CH</span>
          <strong>CampusHire</strong>
        </Link>
        <div className={styles.navLinks}>
          <a href="#readiness">Readiness</a>
          <a href="#opportunities">Opportunities</a>
          <Link href="/sign-in">Sign in</Link>
        </div>
        <Link
          className={styles.navAction}
          href="/sign-up"
          onClick={() => trackProductEvent("profile_start")}
        >
          Create profile
        </Link>
      </nav>

      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroCopy}>
          <p className={styles.positioning}>Evidence before scores</p>
          <h1 id="landing-title">Build a placement story you can stand behind.</h1>
          <p className={styles.heroText}>
            Turn reviewed education, skills, projects, and goals into one credible
            profile—then see the opportunities you are formally eligible for.
          </p>
          <div className={styles.heroActions}>
            <Link
              className={styles.primaryAction}
              href="/sign-up"
              onClick={() => trackProductEvent("profile_start")}
            >
              Create profile <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              className={styles.secondaryAction}
              href="/opportunities"
              onClick={() => trackProductEvent("opportunity_view")}
            >
              Browse opportunities
            </Link>
          </div>
        </div>
        <figure className={styles.heroVisual} data-hero-image>
          <Image
            src="/images/student-proof-editorial.png"
            alt="Reviewed resume, project notes, and technical work arranged as placement evidence"
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 760px) 92vw, 47vw"
          />
          <figcaption>Evidence should be reviewable, specific, and yours.</figcaption>
        </figure>
      </section>

      <section className={styles.bentoSection} id="readiness" aria-labelledby="readiness-title">
        <header className={styles.sectionHeading}>
          <p>From profile to possibility</p>
          <h2 id="readiness-title">Readiness becomes a reasoned next action.</h2>
        </header>
        <div className={styles.evidenceBento}>
          <article className={`${styles.bentoCard} ${styles.bentoProfile}`}>
            <FileCheck2 aria-hidden="true" />
            <h3>A profile built from reviewed facts</h3>
            <p>Required details get you started. Skills, links, and a resume add useful evidence without becoming hidden barriers.</p>
          </article>
          <article className={`${styles.bentoCard} ${styles.bentoEligibility}`}>
            <ShieldCheck aria-hidden="true" />
            <div><h3>Formal eligibility</h3><p>Deterministic rules, shown line by line.</p></div>
          </article>
          <article className={`${styles.bentoCard} ${styles.bentoMatch}`}>
            <Scale aria-hidden="true" />
            <div><h3>Role match</h3><p>Explained separately after eligibility.</p></div>
          </article>
          <article className={`${styles.bentoCard} ${styles.bentoAction}`}>
            <div>
              <Route aria-hidden="true" />
              <p>One useful move</p>
              <h3>Add deployment evidence</h3>
            </div>
            <p>Because your target role values shipped backend work, a monitored API and concise technical write-up create stronger proof than another generic course.</p>
            <Link href="/roadmap">See the sample roadmap <ArrowRight size={17} aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className={styles.explanationSection} id="opportunities" aria-labelledby="explanation-title">
        <div className={styles.sectionHeading}>
          <p>Clear by design</p>
          <h2 id="explanation-title">Know which system produced each result.</h2>
          <span>A match score never decides formal eligibility.</span>
        </div>
        <div className={styles.accordion}>
          {explanations.map((item) => {
            const isOpen = openExplanation === item.id;
            return (
              <article className={isOpen ? styles.accordionOpen : undefined} key={item.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`explanation-${item.id}`}
                  onClick={() => setOpenExplanation(item.id)}
                >
                  <span>{item.title}</span>
                  <ArrowRight aria-hidden="true" />
                </button>
                <p id={`explanation-${item.id}`}>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.journey} data-readiness-journey aria-labelledby="journey-title">
        <header data-readiness-heading>
          <p>One connected journey</p>
          <h2 id="journey-title">Each proof unlocks a clearer move.</h2>
        </header>
        <div className={styles.journeyPanels}>
          <article data-evidence-panel><span>Identity and education</span><h3>Start with the placement facts your institution can verify.</h3><CheckCircle2 aria-hidden="true" /></article>
          <article data-evidence-panel><span>Skills and projects</span><h3>Add the evidence that explains what you can do now.</h3><FileCheck2 aria-hidden="true" /></article>
          <article data-evidence-panel><span>Target role</span><h3>Compare your reviewed profile with eligible opportunities.</h3><Scale aria-hidden="true" /></article>
          <article data-evidence-panel><span>Next action</span><h3>Build one missing piece instead of chasing another score.</h3><Route aria-hidden="true" /></article>
        </div>
      </section>

      <section className={styles.paths} aria-labelledby="paths-title">
        <h2 id="paths-title">Curated paths for the roles students actually pursue.</h2>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {careerPaths.map((path) => <span key={path}>{path}</span>)}
            <div aria-hidden="true" className={styles.marqueeDuplicate}>
              {careerPaths.map((path) => <span key={`duplicate-${path}`}>{path}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.principles} id="principles" aria-labelledby="principles-title">
        <div>
          <p>What stays accountable</p>
          <h2 id="principles-title">Assistance you can inspect.</h2>
        </div>
        <article aria-live="polite">
          <ShieldCheck aria-hidden="true" />
          <h3>{principles[principle].title}</h3>
          <p>{principles[principle].body}</p>
          <div>
            <button type="button" onClick={() => movePrinciple(-1)} aria-label="Previous principle"><ArrowLeft aria-hidden="true" /></button>
            <span>{principle + 1} / {principles.length}</span>
            <button type="button" onClick={() => movePrinciple(1)} aria-label="Next principle"><ArrowRight aria-hidden="true" /></button>
          </div>
        </article>
      </section>

      <section className={styles.finalAction} aria-labelledby="final-action-title">
        <p>Start with what is true today.</p>
        <h2 id="final-action-title">Build the profile. See the opportunity. Make the next move count.</h2>
        <Link href="/sign-up" onClick={() => trackProductEvent("profile_start")}>
          Create your student profile <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/"><span aria-hidden="true">CH</span><strong>CampusHire</strong></Link>
        <div><Link href="/privacy">Privacy and AI assistance</Link><Link href="/sign-in">Student sign in</Link><Link href="/admin/sign-in">TNP access</Link></div>
        <p>AI supports decisions. Deterministic rules and accountable humans remain authoritative.</p>
      </footer>
    </main>
  );
}
