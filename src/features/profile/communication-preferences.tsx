"use client";

import { useEffect, useState } from "react";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./communication-preferences.module.css";

type Preferences = {
  application_updates: boolean;
  deadline_reminders: boolean;
  security_emails: true;
  account_emails: true;
};

export function CommunicationPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<Preferences>("/communications/preferences", { signal: controller.signal })
      .then(setPreferences)
      .catch(() => setStatus("Communication preferences could not be loaded."));
    return () => controller.abort();
  }, []);

  async function change(key: "application_updates" | "deadline_reminders", value: boolean) {
    if (!preferences) return;
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next); setStatus("Saving…");
    try {
      setPreferences(await csrfRequest<Preferences>("/communications/preferences", { method: "PUT", body: JSON.stringify({ application_updates: next.application_updates, deadline_reminders: next.deadline_reminders }) }));
      setStatus("Preferences saved.");
    } catch { setPreferences(previous); setStatus("Preferences were not changed. Try again."); }
  }

  return <section className={styles.panel} aria-labelledby="communication-title" aria-busy={!preferences}>
    <header><p>Communication</p><h2 id="communication-title">Email preferences</h2><span>Optional messages can be disabled. Security and account delivery remains on.</span></header>
    <div className={styles.options}>
      <label><span><strong>Application updates</strong><small>Status changes are always visible in CampusHire.</small></span><input type="checkbox" checked={preferences?.application_updates ?? false} disabled={!preferences} onChange={(event) => void change("application_updates", event.target.checked)} /></label>
      <label><span><strong>Deadline reminders</strong><small>Optional reminders may pause when the email service is busy.</small></span><input type="checkbox" checked={preferences?.deadline_reminders ?? false} disabled={!preferences} onChange={(event) => void change("deadline_reminders", event.target.checked)} /></label>
      <div><span><strong>Security and account</strong><small>Invitation, recovery, and security notices protect access and cannot be disabled.</small></span><b>Always on</b></div>
    </div>
    {status ? <p className={styles.status} role="status">{status}</p> : null}
  </section>;
}
