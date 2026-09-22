import type { ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

import styles from "./public-site-header.module.css";

type PublicSiteHeaderProps = {
  navigation?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
  landing?: boolean;
};

export function PublicSiteHeader({
  navigation,
  actions,
  sticky = false,
  landing = false,
}: PublicSiteHeaderProps) {
  const className = [styles.header, sticky ? styles.sticky : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className} data-public-header data-landing-header={landing ? "" : undefined}>
      <div className={`${styles.inner}${navigation ? ` ${styles.withNavigation}` : ""}`}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <BrandMark />
          <strong>CampusHire</strong>
        </Link>
        {navigation ? <div className={styles.navigation}>{navigation}</div> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
