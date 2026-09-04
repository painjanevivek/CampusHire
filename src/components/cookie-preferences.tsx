"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";

import styles from "./cookie-preferences.module.css";

const preferenceKey = "campushire_cookie_preference_v1";
const essentialOnly = "essential-only";

export function CookiePreferences() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let preferenceSaved = false;
    try {
      preferenceSaved = window.localStorage.getItem(preferenceKey) === essentialOnly;
    } catch {
      // Show the receipt when browser storage cannot preserve the preference.
    }
    const hydration = window.setTimeout(() => {
      setOpen(!preferenceSaved);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  function savePreference() {
    try {
      window.localStorage.setItem(preferenceKey, essentialOnly);
    } catch {
      // The preference can remain session-only when browser storage is unavailable.
    }
    setOpen(false);
    window.setTimeout(() => settingsButtonRef.current?.focus(), 0);
  }

  function reopenPreferences() {
    setOpen(true);
    window.setTimeout(() => saveButtonRef.current?.focus(), 0);
  }

  if (!ready) return null;

  if (!open) {
    return (
      <button
        ref={settingsButtonRef}
        className={styles.settingsButton}
        type="button"
        onClick={reopenPreferences}
        aria-expanded="false"
      >
        <Cookie aria-hidden="true" />
        Cookie settings
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-labelledby="cookie-preferences-title">
      <div className={styles.heading}>
        <span className={styles.icon}><Cookie aria-hidden="true" /></span>
        <div>
          <p>Cookie receipt · essential only</p>
          <h2 id="cookie-preferences-title">Cookies with a security job.</h2>
        </div>
      </div>

      <p className={styles.description}>
        CampusHire uses essential cookies for secure sign-in, session continuity, and form protection. We do not currently use analytics or advertising cookies.
      </p>

      <div className={styles.statusRow}>
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Security and session cookies</strong>
          <span>Always active when you use account features</span>
        </div>
        <span className={styles.status}>Required</span>
      </div>

      <div className={styles.actions}>
        <button ref={saveButtonRef} type="button" onClick={savePreference}>
          Save essential-only preference
        </button>
        <Link href="/privacy#cookies">Privacy details</Link>
      </div>
    </aside>
  );
}
