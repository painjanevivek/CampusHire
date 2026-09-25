"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";

import styles from "./cookie-preferences.module.css";

// Bump this key before introducing any optional cookie category so consent is requested again.
const preferenceKey = "campushire_cookie_preference_v1";
const reopenEvent = "campushire:open-cookie-preferences";
type CookieChoice = "all" | "essential-only" | "declined";

function isSavedChoice(value: string | null): value is CookieChoice {
  return value === "all" || value === "essential-only" || value === "declined";
}

export function CookiePreferenceTrigger() {
  return (
    <button
      type="button"
      onClick={(event) => window.dispatchEvent(new CustomEvent(reopenEvent, {
        detail: { returnFocus: event.currentTarget },
      }))}
    >
      Change cookie preference
    </button>
  );
}

export function CookiePreferences() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let preferenceSaved = false;
    try {
      preferenceSaved = isSavedChoice(window.localStorage.getItem(preferenceKey));
    } catch {
      // Ask again after a reload when browser storage cannot preserve the preference.
    }
    const hydration = window.setTimeout(() => {
      setOpen(!preferenceSaved);
      setReady(true);
    }, 0);
    const reopen = (event: Event) => {
      window.clearTimeout(hydration);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
      returnFocusRef.current = (event as CustomEvent<{ returnFocus?: HTMLElement }>).detail?.returnFocus ?? null;
      setClosing(false);
      setOpen(true);
      setReady(true);
    };
    window.addEventListener(reopenEvent, reopen);
    return () => {
      window.clearTimeout(hydration);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      window.removeEventListener(reopenEvent, reopen);
    };
  }, []);

  useEffect(() => {
    if (open) firstChoiceRef.current?.focus();
  }, [open]);

  function savePreference(choice: CookieChoice) {
    if (closing) return;
    try {
      window.localStorage.setItem(preferenceKey, choice);
    } catch {
      // The preference can remain session-only when browser storage is unavailable.
    }
    setClosing(true);
    const closeDelay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
      closeTimerRef.current = null;
    }, closeDelay);
  }

  if (!ready || !open) return null;

  return (
    <aside className={`${styles.panel} ${closing ? styles.closing : ""}`} role="dialog" aria-modal="false" aria-labelledby="cookie-preferences-title">
      <div className={styles.heading}>
        <span className={styles.icon}><Cookie aria-hidden="true" /></span>
        <div>
          <p>Cookie preferences</p>
          <h2 id="cookie-preferences-title">Choose your cookies</h2>
        </div>
      </div>

      <p className={styles.description}>
        CampusHire currently uses only essential cookies for sign-in and security. No analytics or advertising cookies are active. We will ask again if optional cookies are introduced.
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
        <button ref={firstChoiceRef} type="button" disabled={closing} onClick={() => savePreference("essential-only")}>Essential only</button>
        <button type="button" disabled={closing} onClick={() => savePreference("all")}>Allow all</button>
        <button type="button" disabled={closing} onClick={() => savePreference("declined")}>Decline optional</button>
        <Link href="/privacy#cookies">Privacy details</Link>
      </div>
    </aside>
  );
}
