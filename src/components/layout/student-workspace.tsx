import type { ReactNode } from "react";

import { StudentHeader } from "./student-header";
import styles from "./student-workspace.module.css";

export function StudentWorkspace({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={styles.workspace}>
      <StudentHeader />
      <div className={`${styles.content} ${aside ? styles.withAside : ""}`}>
        <div className={styles.body}>{children}</div>
        {aside ? <aside className={styles.contextPanel}>{aside}</aside> : null}
      </div>
    </div>
  );
}
