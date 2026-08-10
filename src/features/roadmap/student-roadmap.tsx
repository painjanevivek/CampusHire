import Link from "next/link";
import { ArrowRight, Check, Circle, LockKeyhole, Route } from "lucide-react";

import styles from "./student-roadmap.module.css";

const milestones = [
  { state: "done", title: "Python foundations", detail: "CLI data project reviewed", meta: "EVIDENCE / 02" },
  { state: "done", title: "Applied statistics", detail: "Evaluation metrics explained", meta: "EVIDENCE / 04" },
  { state: "next", title: "Machine-learning workflow", detail: "Train and document a baseline model", meta: "NEXT / 14 DAYS" },
  { state: "later", title: "LLM application safety", detail: "Grounding and injection tests", meta: "QUEUED / 04" },
  { state: "later", title: "Deploy evidence", detail: "Monitored API and project write-up", meta: "QUEUED / 05" },
] as const;

export function StudentRoadmap() {
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>AI Engineer / roadmap v1</p><h1>Build the next proof.<br /><em>Then the next.</em></h1><span>Your profile suggests what may be complete. You confirm every milestone.</span></div>
        <div className={styles.score}><strong>02</strong><span>of 05<br />confirmed</span></div>
      </header>
      <section className={styles.timeline} aria-label="AI Engineer roadmap">
        {milestones.map((node, index) => (
          <article key={node.title} className={styles[node.state]}>
            <div className={styles.sequence}><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
            <span className={styles.icon} aria-hidden="true">{node.state === "done" ? <Check /> : node.state === "next" ? <Circle /> : <LockKeyhole />}</span>
            <div className={styles.copy}>
              <p>{node.state === "done" ? "Confirmed" : node.state === "next" ? "Next best move" : "Later"}</p>
              <h2>{node.title}</h2>
              <span>{node.detail}</span>
            </div>
            <span className={styles.meta}>{node.meta}</span>
            {node.state === "next" && <Link href="/resume" className={styles.action}>Open milestone <ArrowRight size={17} aria-hidden="true" /></Link>}
          </article>
        ))}
      </section>
      <aside className={styles.note}><Route size={20} aria-hidden="true" /><div><strong>Your roadmap is evidence-led.</strong><p>Completing a milestone does not claim proficiency until you attach and review proof.</p></div></aside>
    </main>
  );
}
