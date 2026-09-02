"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

import styles from "./profile-workspace.module.css";

type AccountDisclosureProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  status?: string;
  title: string;
  tone?: "default" | "danger";
};

export function AccountDisclosure({
  children,
  description,
  eyebrow,
  icon: Icon,
  status,
  title,
  tone = "default",
}: AccountDisclosureProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const triggerId = `${contentId}-trigger`;

  return (
    <section className={styles.disclosure} data-open={open} data-tone={tone}>
      <button
        id={triggerId}
        className={styles.disclosureTrigger}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.disclosureIcon}><Icon aria-hidden="true" /></span>
        <span className={styles.disclosureCopy}>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
        {status ? <span className={styles.disclosureStatus}>{status}</span> : null}
        <ChevronDown className={styles.disclosureChevron} aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={contentId}
          className={styles.disclosureContent}
          role="region"
          aria-labelledby={triggerId}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
