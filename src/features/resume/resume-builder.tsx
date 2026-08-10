"use client";

import { useState } from "react";
import { Check, Edit3, FileDown, Sparkles } from "lucide-react";

import styles from "./resume-builder.module.css";

const proposed = "Built a placement workflow that separates eligibility rules from role similarity.";

export function ResumeBuilder() {
  const [editing, setEditing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [copy, setCopy] = useState(proposed);

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><p>Evidence-backed editing</p><h1>Resume builder</h1><span>Strengthen the writing without turning suggestions into unsupported claims.</span></div>
        <button className={styles.download}><FileDown size={17} aria-hidden="true" /> Download PDF</button>
      </header>
      <div className={styles.grid}>
        <section className={styles.paper} aria-label="Resume preview">
          <div className={styles.paperHeader}><div><h2>Asha Patil</h2><p>asha@example.edu · github.com/asha · asha.dev</p></div><span>RESUME / 03</span></div>
          <section><h3>Summary</h3><p>Computer science student building reliable data products with Python, SQL, and thoughtful testing.</p></section>
          <section><h3>Projects</h3><p><strong>CampusHire matching engine</strong><br />Built deterministic eligibility rules separately from semantic role matching.</p></section>
          <section><h3>Skills</h3><p className={styles.skills}>Python · SQL · FastAPI · React · PostgreSQL</p></section>
        </section>
        <aside className={styles.review} aria-labelledby="suggestion-title">
          <div className={styles.score}><Sparkles size={20} aria-hidden="true" /><div><span>CampusHire readiness</span><strong>82 / 100</strong></div></div>
          <p className={styles.guardrail}>Suggestions never become resume claims until you accept them.</p>
          <article className={styles.suggestion}>
            <p>Clarity suggestion / 01</p>
            <h2 id="suggestion-title">Make the work specific.</h2>
            <del>Worked on a placement project.</del>
            {editing ? (
              <textarea aria-label="Edit proposed resume language" value={copy} onChange={(event) => setCopy(event.target.value)} />
            ) : <blockquote>{copy}</blockquote>}
            <small>More precise without adding an unsupported result.</small>
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => setEditing(true)} aria-label="Edit suggestion"><Edit3 size={15} aria-hidden="true" /> Edit</button>
              <button type="button" className={styles.primary} onClick={() => { setAccepted(true); setEditing(false); }} aria-label="Accept suggestion"><Check size={15} aria-hidden="true" /> Accept</button>
            </div>
            {accepted && <p className={styles.accepted} role="status">Suggestion accepted. Your reviewed copy is ready.</p>}
          </article>
        </aside>
      </div>
    </main>
  );
}
