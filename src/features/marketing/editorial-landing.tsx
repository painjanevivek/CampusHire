import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  Fingerprint,
  Scale,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import { PublicSiteHeader } from "@/components/layout/public-site-header";
import { BrandMark } from "@/components/brand-mark";
import { LandingMotion } from "./landing-motion";
import { ThemeToggle } from "./theme-toggle";
import styles from "./editorial-landing.module.css";

const recordSteps = [
  {
    number: "01",
    title: "Your profile",
    detail: "Education, skills, projects, and links you can review.",
  },
  {
    number: "02",
    title: "Reviewed resume",
    detail: "A chosen version stays attached to the application.",
  },
  {
    number: "03",
    title: "Published eligibility",
    detail: "Every rule is checked separately and explained.",
  },
  {
    number: "04",
    title: "Application snapshot",
    detail: "Your submitted details and the rules used for the decision stay unchanged.",
  },
  {
    number: "05",
    title: "Human decision",
    detail: "The placement team records the outcome and its reason.",
  },
];

const journey = [
  {
    number: "01",
    label: "Build the record",
    title: "Start with details you recognise.",
    description:
      "Complete a resumable profile, add projects and professional links, then review the resume CampusHire will use.",
    note: "Nothing is submitted while you are still preparing.",
  },
  {
    number: "02",
    label: "Read the role",
    title: "Know why you can apply.",
    description:
      "Published requirements, deterministic eligibility, and optional role relevance appear as separate signals.",
    note: "Missing data creates a review state—not a hidden rejection.",
  },
  {
    number: "03",
    label: "Keep the snapshot",
    title: "Apply without losing the context.",
    description:
      "Your application retains the exact profile, resume, policy, rule, and scoring versions used at submission.",
    note: "Later profile edits do not rewrite the original record.",
  },
  {
    number: "04",
    label: "Close the loop",
    title: "Respond, review, and record.",
    description:
      "Students answer requests for missing information while authorised placement staff keep relevant records beside each decision.",
    note: "Supplemental responses never erase the first submission.",
  },
];

function ProductFrame({
  className,
  src,
  alt,
  label,
  title,
  description,
}: {
  className?: string;
  src: string;
  alt: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <figure className={className}>
      <div className={styles.productFrameTop}>
        <span className={styles.windowDots} aria-hidden="true"><i /><i /><i /></span>
        <span>{label}</span>
        <span>Synthetic demo</span>
      </div>
      <div className={styles.productImage}>
        <Image src={src} alt={alt} fill sizes="(max-width: 900px) 94vw, 58vw" />
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{description}</span>
      </figcaption>
    </figure>
  );
}

export function EditorialLanding() {
  return (
    <LandingMotion className={styles.page}>
      <PublicSiteHeader
        sticky
        landing
        navigation={
          <nav className={styles.primaryNav} aria-label="Primary navigation">
            <a href="#record">How it works</a>
            <a href="#product">Workspaces</a>
            <a href="#boundaries">Eligibility &amp; AI</a>
            <Link href="/docs">Guide</Link>
          </nav>
        }
        actions={
          <nav className={styles.headerActions} aria-label="Account access">
            <ThemeToggle />
            <Link href="/sign-in">Sign in</Link>
            <Link className={styles.headerCta} href="/sign-up?from=/">Create profile</Link>
          </nav>
        }
      />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="landing-title" data-landing-hero>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy} data-hero-copy>
              <p className={styles.kicker}><span>Student profile</span><ArrowRight aria-hidden="true" /><span>Human decision</span></p>
            <h1 id="landing-title">Campus placement, <em>with clear decisions.</em></h1>
              <p className={styles.heroDescription}>
                CampusHire gives students and placement teams one accountable record for preparation,
                eligibility, applications, and review.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href="/sign-up?from=/">
                  Create your profile <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a className={styles.textAction} href="#record">
                  See the placement record <ArrowDownRight size={18} aria-hidden="true" />
                </a>
              </div>
              <p className={styles.heroNote}>
                <BadgeCheck size={17} aria-hidden="true" />
                Eligibility follows published rules. AI remains advisory.
              </p>
            </div>

            <aside className={styles.heroProduct} aria-label="Student workspace product preview" data-hero-card>
              <div className={styles.heroProductMeta}>
                <span>Student workspace / next action</span>
                <span>01</span>
              </div>
              <div className={styles.heroImage}>
                <Image
                  src="/product-evidence/student-priorities.png"
                  alt="CampusHire student readiness workspace showing a next placement action and reviewed profile details"
                  fill
                  loading="eager"
                  sizes="(max-width: 900px) 94vw, 52vw"
                />
              </div>
              <div className={styles.heroProductFooter}>
                <span><i /> Profile ready</span>
                <span>Next action stays visible</span>
              </div>
            </aside>
          </div>
          <div className={styles.heroIndex} aria-hidden="true">
            <span>CH / 01</span>
            <span>Placement records, not black-box scores</span>
          </div>
        </section>

        <section
          className={styles.record}
          id="record"
          aria-label="The placement record"
          data-reveal-group
        >
          <header data-reveal-item>
            <p className={styles.sectionLabel}>One record, start to finish</p>
            <h2>What follows the application?</h2>
            <span>
              See the profile details, published rules, and actions behind each result.
            </span>
          </header>
          <ol className={styles.recordTrack}>
            {recordSteps.map((step) => (
              <li key={step.number} data-reveal-item>
                <span className={styles.recordNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={styles.productStory}
          id="product"
          aria-label="CampusHire product views"
          data-reveal-group
        >
          <header className={styles.productIntro} data-reveal-item>
            <p className={styles.sectionLabel}>The same truth, seen from both sides</p>
            <h2>One application record.<br />Two accountable views.</h2>
            <p>
              Students see the action they need to take. Placement teams see the information they need
              to review. The handoff stays explicit.
            </p>
            <span className={styles.evidenceDisclaimer}>
              Product captures use synthetic demonstration data, never real student records.
            </span>
          </header>
          <div className={styles.productComposition}>
            <ProductFrame
              className={styles.studentFrame}
              src="/product-evidence/student-priorities.png"
              alt="Student readiness workspace with one next action and four reviewed profile sections"
              label="Student workspace"
              title="The student sees the next move."
              description="The next action, its reason, and the profile details behind it stay together."
            />
            <ProductFrame
              className={styles.placementFrame}
              src="/product-evidence/placement-review.png"
              alt="Placement team application review with a candidate queue and eligibility details"
              label="T&P workspace"
              title="The team sees the review trail."
              description="Candidate details, eligibility rules, and the resulting decision share one view."
            />
          </div>
        </section>

        <section className={styles.journey} aria-labelledby="journey-title" data-reveal-group>
          <div className={styles.journeyHeading} data-reveal-item>
            <p className={styles.sectionLabel}>A placement journey with memory</p>
            <h2 id="journey-title">Every step keeps its context.</h2>
            <p>
              CampusHire connects readiness to recruitment without turning preparation signals into
              hiring authority.
            </p>
          </div>
          <div className={styles.journeySteps}>
            {journey.map((step) => (
              <article key={step.number} data-reveal-item>
                <div className={styles.journeyMeta}>
                  <span>{step.number}</span>
                  <span>{step.label}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <small>{step.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.boundaries}
          id="boundaries"
          aria-labelledby="boundaries-title"
          data-reveal-group
        >
          <header data-reveal-item>
            <p className={styles.sectionLabel}>Intelligence with a visible boundary</p>
            <h2 id="boundaries-title">Useful guidance.<br />No hidden authority.</h2>
          </header>
          <div className={styles.signalBoard} data-reveal-item>
            <article>
              <div className={styles.signalIcon}><FileCheck2 aria-hidden="true" /></div>
              <span className={styles.signalType}>Formal signal</span>
              <h3>Eligibility</h3>
              <p>Published college rules evaluate each requirement and return reasons you can inspect.</p>
              <strong><BadgeCheck size={16} aria-hidden="true" /> Determines whether rules are met</strong>
            </article>
            <div className={styles.signalDivider} aria-hidden="true"><span>kept separate</span></div>
            <article>
              <div className={styles.signalIcon}><Sparkles aria-hidden="true" /></div>
              <span className={styles.signalType}>Advisory signal</span>
              <h3>Role match</h3>
              <p>Reviewed skills and projects can explain relevance when the matching service is available.</p>
              <strong><Scale size={16} aria-hidden="true" /> A match score never decides whether you can apply.</strong>
            </article>
          </div>
          <div className={styles.boundaryLedger} data-reveal-item>
            <p><Fingerprint aria-hidden="true" /> AI can explain results, suggest wording, and bring relevant profile details into view.</p>
            <p><UserRoundCheck aria-hidden="true" /> Students approve their details before action.</p>
            <p><Building2 aria-hidden="true" /> Official decisions stay with published rules and responsible people.</p>
          </div>
        </section>

        <section className={styles.entryPoints} aria-labelledby="entry-title" data-reveal-group>
          <header data-reveal-item>
            <p className={styles.sectionLabel}>Choose your workspace</p>
            <h2 id="entry-title">Same record. Different responsibility.</h2>
          </header>
          <div className={styles.entryGrid}>
            <article data-reveal-item>
              <span className={styles.entryNumber}>01 / Student</span>
              <h3>Build a placement story you can stand behind.</h3>
              <p>Create your profile, review your resume, understand roles, and track what happens next.</p>
              <div>
                <Link className={styles.primaryAction} href="/sign-up?from=/">Start a student profile <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link className={styles.textAction} href="/sign-in">Open student sign in</Link>
              </div>
            </article>
            <article data-reveal-item>
              <span className={styles.entryNumber}>02 / Training &amp; Placement</span>
              <h3>Keep student records beside every placement decision.</h3>
              <p>Publish requirements, review applications, request clarification, and preserve an audit trail.</p>
              <div>
                <Link className={styles.darkAction} href="/tnp/sign-in">Open T&amp;P sign in <ArrowRight size={18} aria-hidden="true" /></Link>
              </div>
              <small>T&amp;P accounts are issued by the institution—there is no public registration.</small>
            </article>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <BrandMark />
          <div><strong>CampusHire</strong><span>Accountable campus recruitment</span></div>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/docs">Documentation</Link>
          <Link href="/privacy">Privacy &amp; AI</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
        </nav>
        <p>AI can help explain the record. People remain responsible for the decision.</p>
      </footer>
    </LandingMotion>
  );
}
