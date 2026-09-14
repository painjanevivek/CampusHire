"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { InstitutionRegistrationStartResponse } from "@/lib/api/generated/types.gen";

export function InstitutionSignUpForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await csrfRequest<InstitutionRegistrationStartResponse>(
        "/auth/institution-registrations",
        {
          method: "POST",
          body: JSON.stringify({
            institution_name: data.get("institution_name"),
            institution_code: data.get("institution_code"),
            institutional_email: data.get("institutional_email"),
            domain: data.get("domain"),
          }),
        },
      );
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Registration could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      <Input id="institution_name" name="institution_name" label="Institution name" required maxLength={200} />
      <Input
        id="institution_code"
        name="institution_code"
        label="Institution code"
        hint="Lowercase letters, numbers, and hyphens."
        required
        pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]"
      />
      <Input
        id="institutional_email"
        name="institutional_email"
        type="email"
        label="Institutional administrator email"
        required
        autoComplete="email"
      />
      <Input id="domain" name="domain" label="Institution domain" placeholder="college.edu" required />
      <Alert tone="info">
        Registration does not grant administrator access. CampusHire verifies the domain, reviews duplicates,
        and sends an owner invitation after approval. MFA is then required.
      </Alert>
      <Button type="submit" disabled={busy} aria-busy={busy}>Request T&amp;P access</Button>
    </form>
  );
}
