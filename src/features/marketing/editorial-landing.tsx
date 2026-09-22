import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Scale, ShieldCheck, UserCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LandingMotion } from "./landing-motion";
import { ThemeToggle } from "./theme-toggle";
import styles from "./editorial-landing.module.css";

const journey = [
  ["01", "Prepare", "Review your profile and resume, then work through approved preparation activities."],
  ["02", "Understand eligibility", "See published requirements and the evidence used to check them."],
  ["03", "Apply", "Choose a reviewed resume and confirm the details saved with your application."],
  ["04", "Track", "Follow recorded decisions and respond to requests from your placement team."],
];

function WireframeHeader({ workspace }: { workspace: string }) {
  return (
    <div className={styles.wireframeHeader}>
      <span className={styles.wireframeMark}>C</span>
      <strong>CampusHire</strong>
      <span className={styles.wireframeHeaderRule} />
      <span>{workspace}</span>
      <span className={styles.wireframeConcept}>Interface wireframe</span>
    </div>
  );
}

function StudentWireframe() {
  return (
    <div className={styles.wireframe} role="img" aria-label="Illustrative student workspace wireframe showing a next action and reviewed evidence">
      <WireframeHeader workspace="Student / Overview" />
      <div className={styles.studentCanvas}>
        <div className={styles.studentIntro}>
          <span className={styles.wireframeEyebrow}>Your placement workspace</span>
          <h3>One clear next step.</h3>
          <p>Your application needs one response before the placement team can continue its review.</p>
        </div>
        <div className={styles.studentColumns}>
          <div className={styles.studentAction}>
            <div className={styles.wireframeSectionTop}><span>Next action</span><span className={styles.wireframeStatus}>Action needed</span></div>
            <h4>Respond to your placement team</h4>
            <p>Add the project detail requested for your application. Your original submission stays intact.</p>
            <span className={styles.wireframeButton}>Review request <ArrowRight size={13} aria-hidden="true" /></span>
            <div className={styles.studentActionFoot}><span>01 / 01 open request</span><span>About 5 minutes</span></div>
          </div>
          <div className={styles.studentEvidence}>
            <div className={styles.wireframeSectionTop}><span>Reviewed evidence</span><BadgeCheck size={15} aria-hidden="true" /></div>
            <strong>Ready for review</strong>
            <p>Your saved details remain visible beside the action.</p>
            <ul>
              <li><span>Profile details</span><b>Complete</b></li>
              <li><span>Reviewed resume</span><b>Available</b></li>
              <li><span>Application record</span><b>Saved</b></li>
            </ul>
          </div>
        </div>
        <div className={styles.wireframeFooter}><span className={styles.wireframeFooterDot} /> Request received <span className={styles.wireframeFooterLine} /> Student response <span className={styles.wireframeFooterLine} /> Human review</div>
      </div>
    </div>
  );
}

function PlacementWireframe() {
  return (
    <div className={styles.wireframe} role="img" aria-label="Illustrative training and placement review wireframe showing a candidate queue, eligibility evidence, and human review">
      <WireframeHeader workspace="T&P / Applications" />
      <div className={styles.placementCanvas}>
        <div className={styles.placementRail}><span className={styles.placementRailActive}>Applications</span><span>Drives</span><span>Students</span><span>Reports</span></div>
        <div className={styles.placementMain}>
          <div className={styles.placementTitle}><div><span className={styles.wireframeEyebrow}>Accountable review</span><h3>Applications</h3><p>Evidence stays beside every decision.</p></div><span className={styles.wireframeStatus}>2 to review</span></div>
          <div className={styles.placementColumns}>
            <div className={styles.candidateQueue}>
              <div className={styles.wireframeSectionTop}><span>Candidate queue</span><span>02 records</span></div>
              <div className={styles.candidateSelected}><strong>Candidate 014</strong><span>Backend engineer</span><small>Awaiting student response</small></div>
              <div className={styles.candidateRow}><strong>Candidate 021</strong><span>Graduate engineer</span><small>Ready for review</small></div>
              <div className={styles.queueFooter}>Showing 1–2 of 2</div>
            </div>
            <div className={styles.reviewDetail}>
              <div className={styles.wireframeSectionTop}><span>Review record / 014</span><span className={styles.reviewTag}>Human decision</span></div>
              <h4>Candidate 014</h4>
              <p>Backend engineer · Request for project detail sent</p>
              <div className={styles.eligibilityCard}><strong>Eligibility evidence</strong><span>Published rules checked</span><ul><li>Degree requirement <b>Met</b></li><li>Minimum CGPA <b>Met</b></li><li>Reviewed resume <b>Available</b></li></ul></div>
              <div className={styles.reviewBottom}><span>Clarification remains open</span><span className={styles.wireframeButton}>Open review <ArrowRight size={13} aria-hidden="true" /></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorialLanding() {
  return (
    <LandingMotion className={styles.page}>
      <header className={styles.header} data-landing-header><div className={styles.headerInner}>
        <div className={styles.brandGroup}><Link className={styles.brand} href="/" aria-label="CampusHire home"><BrandMark /><strong>CampusHire</strong></Link><Link className={styles.docsLink} href="/docs">Docs</Link></div>
        <nav aria-label="Primary navigation"><a href="#how-it-works">How it works</a><a href="#preview">Product preview</a><a href="#trust">Trust</a><a href="#faq">FAQ</a></nav>
        <nav className={styles.headerActions} aria-label="Account access"><ThemeToggle /><Link href="/sign-in">Sign In</Link><Link href="/sign-up?from=/">Sign Up</Link></nav>
      </div></header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="landing-title" data-landing-hero>
          <div className={styles.heroCopy} data-hero-copy><p className={styles.eyebrow}>Your campus placement workspace</p><h1 id="landing-title">Your next step, clearly in view.</h1><p className={styles.heroSequence}>Prepare. Apply. Track.</p><p className={styles.heroDescription}>CampusHire connects students and placement teams in one place, with clear requirements and a next step you can act on.</p>
          </div>
          <aside className={styles.heroPreview} aria-label="Illustrative workspace preview" data-hero-card><header><strong>Your placement workspace</strong><span>Illustrative preview</span></header><ul>
            <li><UserCheck aria-hidden="true" /><div><strong>Prepare your profile</strong><span>Review your details and resume.</span></div><BadgeCheck aria-hidden="true" /></li>
            <li><Building2 aria-hidden="true" /><div><strong>Understand each opportunity</strong><span>See published requirements and eligibility.</span></div><ArrowRight aria-hidden="true" /></li>
            <li><ShieldCheck aria-hidden="true" /><div><strong>Track your application</strong><span>Follow decisions and respond to requests.</span></div><ArrowRight aria-hidden="true" /></li>
          </ul><p>One clear action. Your evidence stays in view.</p></aside>
        </section>

        <section className={styles.journey} id="how-it-works" aria-labelledby="journey-title" data-reveal-group><header data-reveal-item><p>How it works</p><h2 id="journey-title">Prepare, understand, apply, and track.</h2></header><ol>{journey.map(([number, title, description]) => <li key={number} data-reveal-item><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>

        <section className={styles.preview} id="preview" aria-label="Product preview" data-reveal-group><header data-reveal-item><p>Inside CampusHire</p><h2>One clear action. Evidence you can inspect.</h2><span>Illustrative interface wireframes, not screenshots or live student records. They show how each workspace keeps the next action and its evidence together.</span></header><div className={styles.productScreens}>
          <figure data-reveal-item><StudentWireframe /><figcaption><strong>Student workspace</strong><span>Find the next task and understand why it matters.</span></figcaption></figure>
          <figure data-reveal-item><PlacementWireframe /><figcaption><strong>T&amp;P workspace</strong><span>Keep the candidate queue, evidence, and human review in one view.</span></figcaption></figure>
        </div></section>

        <section className={styles.trust} id="trust" aria-labelledby="trust-title" data-reveal-group><header data-reveal-item><p>Clear by design</p><h2 id="trust-title">Your details come before scores.</h2></header><div className={styles.trustGrid}>
          <article data-reveal-item><BadgeCheck aria-hidden="true" /><h3>Eligibility</h3><p>Published college rules are checked and shown one by one.</p></article>
          <article data-reveal-item><Scale aria-hidden="true" /><h3>Role match</h3><p>Your reviewed skills and projects explain why a role may suit you.</p><strong>A match score never decides whether you can apply.</strong></article>
          <article data-reveal-item><ShieldCheck aria-hidden="true" /><h3>Privacy and control</h3><p>AI cannot add claims without your approval. Students review their details, and every private download checks access first.</p></article>
        </div></section>

        <section className={styles.audiences} data-reveal-group><article data-reveal-item><UserCheck aria-hidden="true" /><div><p>For students</p><h2>Less guessing. Better applications.</h2><span>See what is left, what it unlocks, and the exact details saved with every application.</span><Link href="/sign-in">Open student sign in</Link></div></article><article data-reveal-item><Building2 aria-hidden="true" /><div><p>For training &amp; placement</p><h2>Clear tools for every college.</h2><span>Build a drive through five publishing steps, preview its rules, then review candidates and track requests for missing information.</span><Link href="/tnp/sign-in">Open T&amp;P sign in</Link></div></article></section>

        <section className={styles.faq} id="faq" aria-labelledby="faq-title" data-reveal-group><header data-reveal-item><p>Common questions</p><h2 id="faq-title">The important details, up front.</h2></header><details open data-reveal-item><summary>Can anyone browse campus opportunities?</summary><p>No. Roles are private to active, verified members of the college that published them.</p></details><details data-reveal-item><summary>Does AI decide whether I am eligible?</summary><p>No. Published rules decide eligibility. AI may suggest how well a role matches, but it never blocks core tasks.</p></details><details data-reveal-item><summary>Who creates Training &amp; Placement accounts?</summary><p>Your institution Admin creates and manages T&amp;P officer accounts. There is no public T&amp;P registration.</p></details><details data-reveal-item><summary>Can AI submit or change my application?</summary><p>No. AI can provide guidance, but you review and approve your details before any application action is taken.</p></details><details data-reveal-item><summary>What if my supporting evidence is missing?</summary><p>CampusHire identifies what needs attention so you can add or correct the source. AI does not invent qualifications or evidence.</p></details><details data-reveal-item><summary>Who can see my student information?</summary><p>Access is limited by role and institution. Private records remain scoped to authorised people in your college workflow.</p></details><details data-reveal-item><summary>What happens after my profile changes?</summary><p>A submitted application keeps the resume, profile details, eligibility result, and rule version used when you applied.</p></details></section>
      </main>

      <footer className={styles.footer}><div><strong>CampusHire</strong><span>Student-first campus recruitment</span></div><nav aria-label="Footer"><Link href="/docs">Docs</Link><Link href="/privacy">Privacy and AI assistance</Link><Link href="/sign-in">Student sign in</Link><Link href="/tnp/sign-in">T&amp;P access</Link></nav><p>AI can help. Published rules and responsible people make the official decisions.</p></footer>
    </LandingMotion>
  );
}
