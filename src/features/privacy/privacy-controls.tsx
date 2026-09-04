import Link from "next/link";
import { Cookie, DatabaseZap, ShieldCheck } from "lucide-react";

import styles from "./privacy-controls.module.css";

export function PrivacyControls() {
  return (
    <main id="main-content" className={styles.page}>
      <header>
        <p>Privacy and AI assistance</p>
        <h1>Your placement data has a defined purpose.</h1>
        <span>
          CampusHire keeps official records, helpful suggestions, and human decisions separate so you can understand each one.
        </span>
      </header>

      <section className={styles.principles} aria-label="Privacy principles">
        <article>
          <ShieldCheck aria-hidden="true" />
          <h2>Review before authority</h2>
          <p>AI may extract, compare, retrieve, and suggest. It cannot silently change your resume or decide formal eligibility.</p>
        </article>
        <article>
          <DatabaseZap aria-hidden="true" />
          <h2>Data used for clear reasons</h2>
          <p>Your profile, academic, resume, and application data help with campus hiring, eligibility explanations, role matches, and approved roadmaps.</p>
        </article>
      </section>

      <section className={styles.choices}>
        <div>
          <p>Your choices</p>
          <h2>Optional details stay optional.</h2>
          <span>GitHub, portfolio, phone, and your first resume upload stay optional unless a published role clearly requires one. Ask your placement cell about corrections, exports, how long data is kept, or appeals.</span>
        </div>
        <Link href="/profile">Review profile details</Link>
      </section>

      <section id="cookies" className={styles.cookieNote} aria-labelledby="cookie-details-title">
        <Cookie aria-hidden="true" />
        <div>
          <p>Cookie controls</p>
          <h2 id="cookie-details-title">Essential cookies, without tracking.</h2>
          <span>CampusHire uses security and session cookies when you sign in or submit a protected form. The website does not currently use analytics or advertising cookies.</span>
        </div>
      </section>
    </main>
  );
}
