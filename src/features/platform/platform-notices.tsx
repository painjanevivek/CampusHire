"use client";

import { useState, type FormEvent } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { RecentMfaVerification } from "@/features/auth/recent-mfa-verification";
import { ApiError, csrfRequest } from "@/lib/api/client";
import styles from "./platform-notices.module.css";

type Delivery = {
  notice_id: string;
  tnp_recipients: number;
  student_recipients: number;
};

export function PlatformNotices() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const toTnp = values.has("to_tnp");
    const toStudents = values.has("to_students");
    if (!toTnp && !toStudents) {
      setError("Select T&P officers, students, or both.");
      return;
    }
    setBusy(true);
    setError("");
    setDelivery(null);
    try {
      const result = await csrfRequest<Delivery>("/platform/notices", {
        method: "POST",
        body: JSON.stringify({
          subject: String(values.get("subject") ?? "").trim(),
          message: String(values.get("message") ?? "").trim(),
          to_tnp: toTnp,
          to_students: toStudents,
        }),
      });
      setDelivery(result);
      form.reset();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "reauthentication_required") {
        setNeedsVerification(true);
        setError("Confirm your current authenticator code, then send the notice again. Your draft is preserved.");
      } else {
        setError(cause instanceof ApiError ? cause.message : "The notice could not be sent.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer context="admin" className={styles.page}>
      <PageHeader eyebrow="Platform communication" title="Notices" description="Send one in-app notice to active T&P officers, students, or both." />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {needsVerification ? <RecentMfaVerification onVerified={() => { setNeedsVerification(false); setError(""); }} /> : null}
      {delivery ? <Alert tone="success">
        Notice sent to {delivery.tnp_recipients.toLocaleString()} T&amp;P account{delivery.tnp_recipients === 1 ? "" : "s"} and {delivery.student_recipients.toLocaleString()} student{delivery.student_recipients === 1 ? "" : "s"}.
        {delivery.tnp_recipients + delivery.student_recipients === 0 ? " No active accounts matched the selected audience." : ""}
      </Alert> : null}
      <section className={styles.panel} aria-labelledby="compose-notice-title">
        <h2 id="compose-notice-title">Compose notice</h2>
        <p>Recipients will see the subject and message in their notification bell. Notices are recorded as in-app updates.</p>
        <form onSubmit={(event) => void send(event)} className={styles.form}>
          <label>Subject<input name="subject" minLength={3} maxLength={180} required /></label>
          <label>Notice<textarea name="message" minLength={3} maxLength={2000} rows={7} required /></label>
          <fieldset>
            <legend>Send to</legend>
            <label><input type="checkbox" name="to_tnp" /> T&amp;P officers</label>
            <label><input type="checkbox" name="to_students" /> Students</label>
          </fieldset>
          <Button disabled={busy}>{busy ? "Sending…" : "Send notice"}</Button>
        </form>
      </section>
    </PageContainer>
  );
}
