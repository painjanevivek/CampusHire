import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./content-page.module.css";

export type ContentSection = { title: string; body: ReactNode };

export function ContentPage({
  eyebrow,
  title,
  introduction,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  summary: string;
  sections: ContentSection[];
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">CampusHire AI</Link>
        <nav aria-label="Guidance"><Link href="/help">Help center</Link><Link href="/status">Service status</Link></nav>
      </header>
      <main id="main-content" className={styles.main}>
        <div className={styles.hero}>
          <div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{introduction}</p></div>
          <aside className={styles.summary}>{summary}</aside>
        </div>
        <section className={styles.sections}>{sections.map((section) => <article key={section.title}><h2>{section.title}</h2><p>{section.body}</p></article>)}</section>
        <footer className={styles.footer}><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/accessibility">Accessibility</Link><Link href="/security">Security</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/data-rights">Data rights</Link><Link href="/appeals">Appeals</Link></footer>
      </main>
    </div>
  );
}
