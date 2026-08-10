import type { ReactNode } from "react";

import { StudentHeader, type WorkspaceSection } from "./student-header";
import styles from "./student-workspace.module.css";

export type { WorkspaceSection } from "./student-header";

export function StudentWorkspace({
  active,
  children,
  aside,
}: {
  active: WorkspaceSection;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={styles.workspace}>
      <StudentHeader active={active} />
      <div className={`${styles.content} ${aside ? styles.withAside : ""}`}>
        <div className={styles.body}>{children}</div>
        {aside ? <aside className={styles.contextPanel}>{aside}</aside> : null}
      </div>
    </div>
  );
}
