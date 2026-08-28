"use client";

import { useState } from "react";
import { csrfRequest } from "@/lib/api/client";
import styles from "./support-form.module.css";

type SupportResponse = { reference: string; status: string };

export function SupportForm() {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true); setStatus("");
    try {
      const response = await csrfRequest<SupportResponse>("/support/requests", {
        method: "POST",
        body: JSON.stringify({
          category: formData.get("category"),
          route_context: formData.get("route_context"),
          message: formData.get("message"),
        }),
      });
      setStatus(`Request recorded. Reference ${response.reference}.`);
    } catch {
      setStatus("The request was not recorded. Remove personal identifiers and try again.");
    } finally { setSubmitting(false); }
  }

  return <form className={styles.form} action={(data) => void submit(data)}>
    <label>Topic<select name="category" defaultValue="account"><option value="account">Account</option><option value="profile">Profile</option><option value="eligibility">Eligibility</option><option value="application">Application</option><option value="resume">Resume</option><option value="roadmap">Roadmap</option><option value="privacy">Privacy</option><option value="accessibility">Accessibility</option><option value="other">Other</option></select></label>
    <label>Page or route<input name="route_context" required pattern="/[a-z0-9/_-]{0,99}" defaultValue="/help" /><small>Example: /applications. Do not paste a URL containing identifiers.</small></label>
    <label>What happened?<textarea name="message" required minLength={20} maxLength={1000} /><small>Do not include names, email addresses, phone or enrollment numbers, resume content, passwords, or tokens.</small></label>
    <button type="submit" disabled={submitting}>{submitting ? "Recording…" : "Record support request"}</button>
    {status ? <p className={styles.status} role="status">{status}</p> : null}
  </form>;
}
