"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ExternalLink, GraduationCap, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { clearCampusHireBrowserState } from "@/components/layout/sign-out-button";
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
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsState, setSessionsState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setSessionsState("loading");
    const [profileResult, sessionsResult] = await Promise.allSettled([
      apiRequest<Profile>("/profile", { cache: "no-store" }),
      apiRequest<Session[]>("/auth/sessions", { cache: "no-store" }),
    ]);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    if (sessionsResult.status === "fulfilled") {
      setSessions(sessionsResult.value);
      setSessionsState("ready");
    } else {
      setSessionsState("error");
    }
    const failures = [profileResult, sessionsResult].filter((result) => result.status === "rejected");
    setMessage(failures.length
      ? "Some profile settings could not be refreshed. Your saved data is unchanged."
      : "");
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

  async function signOutEverywhere() {
    if (!window.confirm("Sign out this browser and every other active CampusHire session?")) return;
    try {
      await csrfRequest<void>("/auth/sign-out-all", { method: "POST" });
    } catch {
      setMessage("Sessions could not be signed out. Your current session is still active.");
      return;
    }
    clearCampusHireBrowserState();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>Profile and account</p><h1>Your verified placement profile.</h1><span>Review the details used for eligibility, manage optional information, and secure every active sign-in.</span></div>
        <div className={styles.readiness}><strong>{profile?.readiness ?? "—"}%</strong><span>profile ready</span></div>
      </header>
      {message ? <Alert tone="warning">{message} <button type="button" onClick={() => void load()}>Retry</button></Alert> : null}

      <section className={styles.grid} aria-label="Profile data">
        <article><UserRound aria-hidden="true" /><p>Personal data</p><h2>{profile?.full_name ?? "Complete your identity"}</h2><span>{profile?.department ?? "Department not added"}</span></article>
        <article><GraduationCap aria-hidden="true" /><p>Education</p><h2>{profile?.education.length ?? 0} record{profile?.education.length === 1 ? "" : "s"}</h2><span>Required academic details are protected from older changes.</span></article>
        <article><BookOpen aria-hidden="true" /><p>Skills and preferences</p><h2>{profile?.target_roles[0] ?? "Choose a target role"}</h2><span>{profile?.skills.length ?? 0} reviewed skill{profile?.skills.length === 1 ? "" : "s"}</span></article>
      </section>

      <section className={styles.actionSection} aria-labelledby="profile-edit-title">
        <div><p>Profile details</p><h2 id="profile-edit-title">Personal data, education, skills, links, and role preferences</h2><span>The six-step editor saves valid changes and protects newer updates opened in another tab.</span></div>
        <Link href="/onboarding">Edit profile details <ExternalLink size={16} aria-hidden="true" /></Link>
      </section>

      <section className={styles.sessions} aria-labelledby="sessions-title">
        <header><div><p>Security</p><h2 id="sessions-title">Active sessions</h2></div><KeyRound aria-hidden="true" /></header>
        {sessionsState === "loading" ? <p>Session details are loading.</p> : null}
        {sessionsState === "error" ? <p>Session details are unavailable. You can still secure the account by signing out every device.</p> : null}
        {sessionsState === "ready" && !sessions.length ? <p>No active session details were returned.</p> : null}
        {sessions.length ? <ul>{sessions.map((session) => (
          <li key={session.id}>
            <div><strong>{session.device_summary ?? "CampusHire session"}{session.current ? " · This device" : ""}</strong><span>Last active {formatDate(session.last_activity_at)} · Expires {formatDate(session.expires_at)}</span></div>
            {!session.current ? <button type="button" onClick={() => void revoke(session)}>Sign out</button> : null}
          </li>
        ))}</ul> : null}
        <button type="button" onClick={() => void signOutEverywhere()}>Sign out all devices</button>
      </section>

      <CommunicationPreferences />

      <section className={styles.governance} aria-label="Privacy and account controls">
        <article><ShieldCheck aria-hidden="true" /><div><h2>Privacy and AI assistance</h2><p>See which records are official, what AI can suggest, and how long data is kept.</p><Link href="/privacy">Review privacy controls</Link></div></article>
        <article><Trash2 aria-hidden="true" /><div><h2>Account deletion</h2><p>Ask to delete student data that can be removed. You must confirm first.</p><Link href="/privacy#deletion-title">Open deletion controls</Link></div></article>
      </section>
    </main>
  );
}
