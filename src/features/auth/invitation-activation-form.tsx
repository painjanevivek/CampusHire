"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";

type Invitation = { email: string; role: string; expires_at: string };

export function InvitationActivationForm({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "submitting" | "unavailable">("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Invitation>(`/auth/invitations/${encodeURIComponent(token)}`)
      .then((result) => { setInvitation(result); setStatus("ready"); })
      .catch(() => setStatus("unavailable"));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("submitting");
    const data = new FormData(event.currentTarget);
    try {
      await csrfRequest(`/auth/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        body: JSON.stringify({
          password: data.get("password"),
          terms_version: "2026-08-28",
          privacy_version: "2026-08-28",
        }),
      });
      router.push(invitation?.role === "tnp_admin" ? "/admin/mfa/setup" : "/onboarding");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check your connection and try again.");
      setStatus("ready");
    }
  }

  if (status === "checking") return <Alert>Checking the invitation securely…</Alert>;
  if (status === "unavailable") return <Alert tone="error">This invitation is expired, revoked, or already used. Ask your placement office for a new link.</Alert>;

  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Alert tone="success"><strong>Verified invitation</strong><br />{invitation?.email}</Alert>
      <Input id="password" name="password" type="password" label="Create password" autoComplete="new-password" minLength={12} maxLength={128} required hint="Use 12 or more characters. Passphrases work well." />
      <label><input name="accept" type="checkbox" required /> I accept the current Terms and Privacy Notice.</label>
      <Button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Activating…" : "Activate account"}</Button>
    </form>
  );
}
