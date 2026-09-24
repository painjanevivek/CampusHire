"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { MfaConfirmResponse, MfaSetupResponse } from "@/lib/api/generated/types.gen";

export function MfaForm({
  mode,
  nextPath = "/admin/dashboard",
}: {
  mode: "setup" | "challenge";
  nextPath?: string;
}) {
  const router = useRouter();
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [qrError, setQrError] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (mode === "setup") {
      csrfRequest<MfaSetupResponse>("/auth/mfa/setup", { method: "POST" }).then(setSetup).catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Could not start authenticator setup.");
      });
    }
  }, [mode]);
  useEffect(() => {
    if (!setup?.provisioning_uri) return;
    let active = true;
    void QRCode.toDataURL(setup.provisioning_uri, {
      width: 224,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111318", light: "#ffffff" },
    }).then((dataUrl) => {
      if (active) setQrCode(dataUrl);
    }).catch(() => {
      if (active) setQrError(true);
    });
    return () => { active = false; };
  }, [setup]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const code = new FormData(event.currentTarget).get("code");
    try {
      const result = await csrfRequest<MfaConfirmResponse | void>(mode === "setup" ? "/auth/mfa/confirm" : "/auth/mfa/challenge", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (mode === "setup" && result && "recovery_codes" in result) {
        setRecoveryCodes(result.recovery_codes);
      } else {
        router.push(nextPath);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check the code and try again.");
    } finally {
      setSubmitting(false);
    }
  }
  if (recoveryCodes.length) {
    return <div className="authForm"><Alert tone="success">Authenticator enabled. Save these recovery codes now; they will not be shown again.</Alert><ul className="recoveryGrid">{recoveryCodes.map((code) => <li key={code}><code>{code}</code></li>)}</ul><Button onClick={() => router.push(nextPath)}>Continue</Button></div>;
  }
  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {mode === "setup" ? <div className="authQrSetup">
        <div>
          <p className="authStepLabel">Recommended</p>
          <h2>Scan the QR code</h2>
          <p>Open your authenticator app, choose <strong>Scan a QR code</strong>, then scan this code.</p>
        </div>
        <div className="authQrFrame" aria-live="polite">
          {qrCode ? <Image src={qrCode} width={224} height={224} unoptimized alt="QR code for adding this CampusHire account to an authenticator app" /> : <span>{qrError ? "QR code unavailable. Use the manual key below." : "Preparing QR code…"}</span>}
        </div>
        <details className="authManualKey"><summary>Use a manual setup key instead</summary><code>{setup?.secret ?? "Preparing secure key…"}</code></details>
      </div> : <p>Enter an authenticator code or an unused recovery code.</p>}
      <Input id="code" name="code" label="Verification code" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={32} required />
      <Button type="submit" disabled={submitting || (mode === "setup" && !setup)}>{submitting ? "Verifying…" : "Verify code"}</Button>
    </form>
  );
}
