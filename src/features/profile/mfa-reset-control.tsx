"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/feedback";
import { ApiError, csrfRequest } from "@/lib/api/client";
import styles from "./profile-workspace.module.css";

export function MfaResetControl() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!window.confirm("Reset your authenticator and sign out every other device?")) return;
    setBusy(true);
    setMessage("");
    try {
      await csrfRequest<void>("/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({
          password: form.get("password"),
          code: form.get("code"),
        }),
      });
      router.replace("/admin/mfa/setup");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The authenticator was not reset.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.mfaReset} onSubmit={(event) => void reset(event)}>
      <p>This security action requires your password and current authenticator or recovery code. Every other active session is revoked, and this device must enroll a replacement immediately.</p>
      {message ? <Alert tone="error">{message}</Alert> : null}
      <div className={styles.mfaResetFields}>
        <label>
          Current password
          <input name="password" type="password" autoComplete="current-password" required maxLength={128} />
        </label>
        <label>
          Authenticator or recovery code
          <input name="code" autoComplete="one-time-code" required minLength={6} maxLength={32} />
        </label>
      </div>
      <button type="submit" disabled={busy}>{busy ? "Resetting…" : "Reset authenticator"}</button>
    </form>
  );
}
