"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearCampusHireBrowserState } from "@/components/layout/sign-out-button";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./profile-workspace.module.css";

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

function deviceLabel(summary: string | null) {
  if (!summary) return "Browser session";
  if (summary.includes(" on ")) return summary;
  const browser = summary.includes("Edg/") ? "Edge"
    : summary.includes("Chrome/") ? "Chrome"
      : summary.includes("Firefox/") ? "Firefox"
        : summary.includes("Safari/") ? "Safari"
          : null;
  const system = summary.includes("Windows") ? "Windows"
    : summary.includes("Mac OS") ? "macOS"
      : summary.includes("Android") ? "Android"
        : summary.includes("iPhone") || summary.includes("iPad") ? "iOS"
          : null;
  return browser && system ? `${browser} on ${system}` : browser ?? system ?? summary;
}

export function SessionManagement({ destination }: { destination: "/sign-in" | "/admin/sign-in" }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const loadSessions = useCallback(async () => {
    setState("loading");
    try {
      setSessions(await apiRequest<Session[]>("/auth/sessions", { cache: "no-store" }));
      setState("ready");
      setMessage("");
    } catch {
      setState("error");
      setMessage("Session details are unavailable. You can still sign out every device.");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void loadSessions(), 0);
    return () => window.clearTimeout(pending);
  }, [loadSessions]);

  async function revoke(session: Session) {
    if (session.current || !window.confirm(`Sign out ${deviceLabel(session.device_summary)}?`)) return;
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
    router.replace(destination);
    router.refresh();
  }

  return (
    <div className={styles.sessionPanel} aria-busy={state === "loading"}>
      {state === "loading" ? <p className={styles.inlineState} role="status">Loading active sessions…</p> : null}
      {message ? <p className={styles.inlineWarning} role="status">{message}</p> : null}
      {state === "ready" && !sessions.length ? <p className={styles.inlineState}>No active session details were returned.</p> : null}
      {sessions.length ? (
        <ul className={styles.sessionList}>
          {sessions.map((session) => (
            <li key={session.id}>
              <div>
                <strong>{deviceLabel(session.device_summary)}</strong>
                <span>Last active {formatDate(session.last_activity_at)} · Expires {formatDate(session.expires_at)}</span>
              </div>
              {session.current ? (
                <span className={styles.currentBadge}>This device</span>
              ) : (
                <button type="button" onClick={() => void revoke(session)}>Sign out</button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.sessionActions}>
        {state === "error" ? <button type="button" onClick={() => void loadSessions()}>Retry session check</button> : null}
        <button className={styles.signOutAll} type="button" onClick={() => void signOutEverywhere()}>Sign out all devices</button>
      </div>
    </div>
  );
}
