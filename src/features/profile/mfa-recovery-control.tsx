"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { MfaConfirmResponse } from "@/lib/api/generated/types.gen";
import styles from "./profile-workspace.module.css";

export function MfaRecoveryControl() {
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function regenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setMessage("");
    setBusy(true);
    try {
      const result = await csrfRequest<MfaConfirmResponse>("/auth/mfa/recovery-codes/regenerate", {
        method: "POST",
        body: JSON.stringify({ password: values.get("password"), code: values.get("code") }),
      });
      setCodes(result.recovery_codes);
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Recovery codes could not be replaced.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.mfaRecovery}>
      <summary>Replace recovery codes</summary>
      {codes.length ? (
        <div>
          <Alert tone="success">Previous recovery codes no longer work. Save these new codes; they will not be shown again.</Alert>
          <ul className="recoveryGrid">{codes.map((code) => <li key={code}><code>{code}</code></li>)}</ul>
        </div>
      ) : (
        <form className={styles.mfaReset} onSubmit={(event) => void regenerate(event)}>
          <p>Confirm your password and current authenticator code to replace all unused recovery codes.</p>
          {message ? <Alert tone="error">{message}</Alert> : null}
          <div className={styles.mfaResetFields}>
            <label>Password to replace recovery codes<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
            <label>Authenticator code to replace recovery codes<input name="code" autoComplete="one-time-code" required minLength={6} maxLength={32} /></label>
          </div>
          <button type="submit" disabled={busy}>{busy ? "Replacing…" : "Replace recovery codes"}</button>
        </form>
      )}
    </details>
  );
}
