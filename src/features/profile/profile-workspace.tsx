"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, GraduationCap, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./profile-workspace.module.css";
import { CommunicationPreferences } from "./communication-preferences";

type Profile = {
  full_name: string | null;
  department: string | null;
  education: Array<Record<string, unknown>>;
  skills: Array<string>;
  target_roles: Array<string>;
  github_url: string | null;
  portfolio_url: string | null;
  readiness: number;
};

type Session = {
  id: string;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  device_summary: string | null;
  current: boolean;
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

export function ProfileWorkspace() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextSessions] = await Promise.all([
        apiRequest<Profile>("/profile", { cache: "no-store" }),
        apiRequest<Session[]>("/auth/sessions", { cache: "no-store" }),
      ]);
      setProfile(nextProfile);
      setSessions(nextSessions);
      setMessage("");
    } catch {
      setMessage("Profile settings could not be refreshed. Your saved data is unchanged.");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function revoke(session: Session) {
    if (session.current || !window.confirm(`Sign out ${session.device_summary ?? "this session"}?`)) return;
    try {
      await csrfRequest<void>(`/auth/sessions/${session.id}`, { method: "DELETE" });
      setSessions((current) => current.filter((item) => item.id !== session.id));
    } catch {
      setMessage("That session could not be signed out. No other session was changed.");
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>Profile and account</p><h1>Your verified placement identity.</h1><span>Review the facts used for eligibility, control optional evidence, and secure every active session.</span></div>
        <div className={styles.readiness}><strong>{profile?.readiness ?? "—"}%</strong><span>evidence readiness</span></div>
      </header>
      {message ? <Alert tone="warning">{message} <button type="button" onClick={() => void load()}>Retry</button></Alert> : null}

      <section className={styles.grid} aria-label="Profile data">
        <article><UserRound aria-hidden="true" /><p>Personal data</p><h2>{profile?.full_name ?? "Complete your identity"}</h2><span>{profile?.department ?? "Department not added"}</span></article>
        <article><GraduationCap aria-hidden="true" /><p>Education</p><h2>{profile?.education.length ?? 0} record{profile?.education.length === 1 ? "" : "s"}</h2><span>Required academic facts remain revision-protected.</span></article>
        <article><BookOpen aria-hidden="true" /><p>Skills and preferences</p><h2>{profile?.target_roles[0] ?? "Choose a target role"}</h2><span>{profile?.skills.length ?? 0} reviewed skill{profile?.skills.length === 1 ? "" : "s"}</span></article>
      </section>

      <section className={styles.actionSection} aria-labelledby="profile-edit-title">
        <div><p>Profile evidence</p><h2 id="profile-edit-title">Personal data, education, skills, links, and role preferences</h2><span>The six-step editor autosaves valid changes and protects newer revisions opened in another tab.</span></div>
        <Link href="/onboarding">Edit profile evidence <ExternalLink size={16} aria-hidden="true" /></Link>
      </section>

      <section className={styles.sessions} aria-labelledby="sessions-title">
        <header><div><p>Security</p><h2 id="sessions-title">Active sessions</h2></div><KeyRound aria-hidden="true" /></header>
        {!sessions.length ? <p>Session details are loading.</p> : <ul>{sessions.map((session) => (
          <li key={session.id}>
            <div><strong>{session.device_summary ?? "CampusHire session"}{session.current ? " · This device" : ""}</strong><span>Last active {formatDate(session.last_activity_at)} · Expires {formatDate(session.expires_at)}</span></div>
            {!session.current ? <button type="button" onClick={() => void revoke(session)}>Sign out</button> : null}
          </li>
        ))}</ul>}
      </section>

      <CommunicationPreferences />

      <section className={styles.governance} aria-label="Privacy and account controls">
        <article><ShieldCheck aria-hidden="true" /><div><h2>Privacy and AI assistance</h2><p>See what is authoritative, what AI can suggest, and how retention works.</p><Link href="/privacy">Review privacy controls</Link></div></article>
        <article><Trash2 aria-hidden="true" /><div><h2>Account deletion</h2><p>Request deletion of eligible student data with explicit confirmation.</p><Link href="/privacy#deletion-title">Open deletion controls</Link></div></article>
      </section>
    </main>
  );
}
