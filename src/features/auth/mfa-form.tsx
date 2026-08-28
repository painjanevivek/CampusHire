"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";

type Setup = { secret: string; provisioning_uri: string };

export function MfaForm({ mode }: { mode: "setup" | "challenge" }) {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (mode === "setup") {
      csrfRequest<Setup>("/auth/mfa/setup", { method: "POST" }).then(setSetup).catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Could not start authenticator setup.");
      });
    }
  }, [mode]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const code = new FormData(event.currentTarget).get("code");
    try {
      const result = await csrfRequest<{ recovery_codes: string[] } | void>(mode === "setup" ? "/auth/mfa/confirm" : "/auth/mfa/challenge", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (mode === "setup" && result && "recovery_codes" in result) {
        setRecoveryCodes(result.recovery_codes);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check the code and try again.");
    } finally {
      setSubmitting(false);
    }
  }
  if (recoveryCodes.length) {
    return <div className="authForm"><Alert tone="success">Authenticator enabled. Save these recovery codes now; they will not be shown again.</Alert><ul className="recoveryGrid">{recoveryCodes.map((code) => <li key={code}><code>{code}</code></li>)}</ul><Button onClick={() => router.push("/admin/dashboard")}>Continue to administration</Button></div>;
  }
  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {mode === "setup" ? <><p>Add the account in your authenticator with this manual key:</p><code>{setup?.secret ?? "Preparing secure key…"}</code></> : <p>Enter an authenticator code or an unused recovery code.</p>}
      <Input id="code" name="code" label="Verification code" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={32} required />
      <Button type="submit" disabled={submitting || (mode === "setup" && !setup)}>{submitting ? "Verifying…" : "Verify code"}</Button>
    </form>
  );
}
