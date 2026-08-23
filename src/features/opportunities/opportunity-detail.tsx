import Link from "next/link";
import { ArrowLeft, BadgeCheck, CircleAlert, MapPin, Sparkles } from "lucide-react";

import styles from "./opportunity-detail.module.css";

export function OpportunityDetail() {
  return (
    <main id="main-content" className={styles.page}>
      <Link href="/opportunities" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back to opportunities</Link>
      <header className={styles.hero}>
        <div><p>Nexora Labs / internship program</p><h1>AI/ML <em>Intern.</em></h1><span><MapPin size={17} aria-hidden="true" /> Bengaluru · Hybrid · ₹35,000 / month · Apply by 25 August 2026</span></div>
        <button className={styles.apply}>Apply with reviewed resume</button>
      </header>
      <div className={styles.decisions}>
        <section className={styles.eligibility} aria-labelledby="eligibility-title">
          <div className={styles.label}><BadgeCheck size={17} aria-hidden="true" /> Formal rule result</div>
          <h2 className={styles.explanationTitle}>Eligibility explained</h2>
          <p>Formal requirements are checked by published placement rules.</p>
          <h2 id="eligibility-title">Formally eligible</h2>
          <ul><li><span>CGPA</span><strong>8.2 meets minimum 7.0</strong></li><li><span>Backlogs</span><strong>0 meets maximum 0</strong></li><li><span>Graduation</span><strong>2027 is allowed</strong></li></ul>
          <code>rule-set: nexora-v1</code>
        </section>
        <section className={styles.match} aria-labelledby="match-title">
          <div className={styles.label}><Sparkles size={17} aria-hidden="true" /> Decision support</div>
          <h2 id="match-title">92% match</h2>
          <p>Python, TensorFlow, and evaluated ML projects align well. Add model deployment evidence to strengthen the explanation.</p>
          <div className={styles.terminal}><span>skills_match</span> = strong<br /><span>model_deployment_proof</span> = pending</div>
        </section>
      </div>
      <p className={styles.disclaimer}><CircleAlert size={18} aria-hidden="true" /> Eligibility is a rule result. Match is decision support, not a hiring probability.</p>
    </main>
  );
}
