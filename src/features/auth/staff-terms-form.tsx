"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { SignInResponse } from "@/lib/api/generated/types.gen";
import { staffMfaSetupPath } from "@/lib/auth/post-auth-route";

const POLICY_VERSION = "2026-08-28";

export function StaffTermsForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await csrfRequest<SignInResponse>("/auth/terms/accept", {
        method: "POST",
        body: JSON.stringify({
          terms_version: POLICY_VERSION,
          privacy_version: POLICY_VERSION,
        }),
      });
      if (result.next_step === "mfa_challenge") {
        router.push(result.user.workspace === "tnp" ? "/tnp/mfa/challenge" : "/admin/mfa/challenge");
        return;
      }
      router.push(staffMfaSetupPath(result.user.workspace));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "The acceptance could not be recorded.");
      setSubmitting(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <label className="signUpConsent">
        <input name="accept" type="checkbox" required />
        <span>
          I have reviewed and accept the current <Link href="/terms" target="_blank">Terms</Link> and{" "}
          <Link href="/privacy" target="_blank">Privacy Notice</Link> for my own staff account.
        </span>
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Recording acceptance…" : "Accept and continue"}
      </Button>
    </form>
  );
}
