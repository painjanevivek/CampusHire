"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Settings, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/features/profile/profile-photo";
import { SignOutButton } from "./sign-out-button";
import styles from "./profile-menu.module.css";

export function ProfileMenu({ open, onChange }: { open: boolean; onChange: (open: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onChange(false); trigger.current?.focus(); }
    };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) onChange(false); };
    window.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open, onChange]);
  return <div ref={root} className={styles.root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onChange(false); }}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={open ? "Close profile menu" : "Open profile menu"} aria-expanded={open} aria-controls="student-profile-menu" onClick={() => onChange(!open)}><ProfileAvatar /></button>
    {open && <nav id="student-profile-menu" aria-label="Your account" className={styles.panel}>
      <p>Your account</p>
      <Link href="/profile" onClick={() => onChange(false)}><UserRound aria-hidden="true" />Profile</Link>
      <Link href="/profile#account-settings" onClick={() => onChange(false)}><Settings aria-hidden="true" />Settings</Link>
      <SignOutButton destination="/sign-in" labeled />
    </nav>}
  </div>;
}
