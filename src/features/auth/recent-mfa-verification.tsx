"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./recent-mfa-verification.module.css";

type Identity = { id: string; username: string | null; email: string };
type SignInResult = { user: Identity; next_step: string };
type VerificationMode = "loading" | "mfa" | "password" | "unavailable";

export function RecentMfaVerification({ onVerified }: { onVerified: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState<VerificationMode>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    let active = true;
    async function loadMethod() {
      try {
        const status = await apiRequest<{ enabled: boolean }>("/auth/mfa/status", { cache: "no-store" });
        if (status.enabled) {
          if (active) setMode("mfa");
          return;
        }
        const currentUser = await apiRequest<Identity>("/auth/me", { cache: "no-store" });
        if (active) {
          setIdentity(currentUser);
          setMode("password");
        }
      } catch {
        if (active) setMode("unavailable");
      }
    }
    void loadMethod();
    return () => { active = false; };
  }, [attempt]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "mfa") {
        await csrfRequest<void>("/auth/mfa/challenge", {
          method: "POST",
          body: JSON.stringify({ code: data.get("code") }),
        });
      } else if (mode === "password" && identity) {
        const result = await csrfRequest<SignInResult>("/auth/sign-in", {
          method: "POST",
          body: JSON.stringify({
            identifier: identity.username ?? identity.email,
            password: data.get("password"),
            workspace: "admin",
          }),
        });
        if (result.user.id !== identity.id || result.next_step !== "complete") {
          throw new Error("Sign-in needs another step. Complete it from your account page before retrying.");
        }
      } else {
        return;
      }
      onVerified();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Re-authentication could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.card} aria-labelledby="recent-verification-title">
    <ShieldAlert className={styles.icon} size={21} aria-hidden="true" />
    <div className={styles.content}>
      <h2 id="recent-verification-title" ref={titleRef} tabIndex={-1}>Re-authentication required</h2>
      <p>Your previous sign-in is too old for this sensitive action. All form entries on this page will be preserved while you verify here.</p>
      {mode === "loading" ? <p role="status">Checking your verification method…</p> : null}
      {mode === "unavailable" ? <div className={styles.actions}><p role="alert">We could not check your verification method.</p><Button type="button" variant="quiet" onClick={() => { setMode("loading"); setAttempt((value) => value + 1); }}>Try again</Button></div> : null}
      {mode === "mfa" || mode === "password" ? <form className={styles.form} onSubmit={(event) => void verify(event)}>
        {mode === "mfa"
          ? <Input id="recent-mfa-code" name="code" label="Current authenticator or recovery code" autoComplete="one-time-code" minLength={6} maxLength={32} required />
          : <PasswordInput id="recent-sign-in-password" name="password" label="Your account password" autoComplete="current-password" required />}
        <Button disabled={busy}>{busy ? "Verifying…" : mode === "mfa" ? "Re-authenticate" : "Sign in again"}</Button>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </form> : null}
    </div>
  </section>;
}
