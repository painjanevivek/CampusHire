import type { ReactNode } from "react";
import Link from "next/link";
import { ProfilePhotoProvider } from "@/features/profile/profile-photo";

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
    <ProfilePhotoProvider><div className={styles.workspace} data-workspace="student">
      <StudentHeader />
      <div className={`${styles.content} ${aside ? styles.withAside : ""}`}>
        <div className={styles.body}>{children}</div>
        {aside ? <aside className={styles.contextPanel}>{aside}</aside> : null}
      </div>
      <footer className={styles.footer}>
        <nav aria-label="Student support and policies">
          <Link href="/help">Help center</Link><Link href="/help/contact">Contact support</Link>
          <Link href="/accessibility">Accessibility</Link><Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p>© {new Date().getFullYear()} CampusHire</p>
      </footer>
    </div></ProfilePhotoProvider>
  );
}
