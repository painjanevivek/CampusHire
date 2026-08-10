import Link from "next/link";
import { ArrowLeft, BadgeCheck, CircleAlert, MapPin, Sparkles } from "lucide-react";

import styles from "./opportunity-detail.module.css";

export function OpportunityDetail() {
  return (
    <main id="main-content" className={styles.page}>
      <Link href="/opportunities" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back to opportunities</Link>
      <header className={styles.hero}>
        <div><p>Northstar Labs / graduate hiring</p><h1>Graduate Software <em>Engineer.</em></h1><span><MapPin size={17} aria-hidden="true" /> Pune · Hybrid · ₹8–10 LPA</span></div>
        <button className={styles.apply}>Apply with resume v3</button>
      </header>
      <div className={styles.decisions}>
        <section className={styles.eligibility} aria-labelledby="eligibility-title">
          <div className={styles.label}><BadgeCheck size={17} aria-hidden="true" /> Formal rule result</div>
          <h2 id="eligibility-title">Formally eligible</h2>
          <ul><li><span>CGPA</span><strong>8.2 meets minimum 7.0</strong></li><li><span>Backlogs</span><strong>0 meets maximum 0</strong></li><li><span>Graduation</span><strong>2027 is allowed</strong></li></ul>
          <code>rule-set: northstar-v1</code>
        </section>
        <section className={styles.match} aria-labelledby="match-title">
          <div className={styles.label}><Sparkles size={17} aria-hidden="true" /> Decision support</div>
          <h2 id="match-title">84% match</h2>
          <p>Python, APIs, and tested backend projects align well. Add deployment evidence to strengthen the explanation.</p>
          <div className={styles.terminal}><span>skills_match</span> = strong<br /><span>deployment_proof</span> = pending</div>
        </section>
      </div>
      <p className={styles.disclaimer}><CircleAlert size={18} aria-hidden="true" /> Eligibility is a rule result. Match is decision support, not a hiring probability.</p>
    </main>
  );
}
