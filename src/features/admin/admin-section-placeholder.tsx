import { CircleAlert } from "lucide-react";

import styles from "./admin-section-placeholder.module.css";

export function AdminSectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main id="main-content" className={styles.page}>
      <header>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className={styles.notice} aria-label={`${title} state`}>
        <CircleAlert aria-hidden="true" />
        <div>
          <h2>No institutional records yet</h2>
          <p>This workspace will populate from verified CampusHire API records.</p>
        </div>
      </section>
    </main>
  );
}
