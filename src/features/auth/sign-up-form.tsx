"use client";

import { useState, type FormEvent } from "react";
import { Building2, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type {
  InstitutionRegistrationStartResponse,
  RegistrationStartResponse,
} from "@/lib/api/generated/types.gen";

type Role = "student" | "tnp";

export function SignUpForm() {
  const [role, setRole] = useState<Role>("student");
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
      if (role === "student") {
        const result = await csrfRequest<RegistrationStartResponse>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            email: data.get("email"),
            invitation_code: data.get("invitation_code") || null,
          }),
        });
        if (result.next_path) {
          window.location.assign(result.next_path);
          return;
        }
        setMessage(result.message);
      } else {
        const result = await csrfRequest<InstitutionRegistrationStartResponse>("/auth/institution-registrations", {
          method: "POST",
          body: JSON.stringify({
            institution_name: data.get("institution_name"),
            institution_code: data.get("institution_code"),
            institutional_email: data.get("institutional_email"),
            domain: data.get("domain"),
          }),
        });
        setMessage(result.message);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Registration could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit} noValidate>
      <div className="roleChoice" role="radiogroup" aria-label="Account type">
        <label htmlFor="account_type_student">
          <input id="account_type_student" type="radio" name="account_type" checked={role === "student"} onChange={() => setRole("student")} />
          <GraduationCap aria-hidden="true" /><span><strong>Student</strong><small>Join your verified college</small></span>
        </label>
        <label htmlFor="account_type_tnp">
          <input id="account_type_tnp" type="radio" name="account_type" checked={role === "tnp"} onChange={() => setRole("tnp")} />
          <Building2 aria-hidden="true" /><span><strong>T&amp;P</strong><small>Register an institution</small></span>
        </label>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {role === "student" ? (
        <>
          <Input id="email" name="email" type="email" label="College email" autoComplete="email" required placeholder="you@college.edu" />
          <Input id="invitation_code" name="invitation_code" label="Invitation code (optional)" hint="Use the code from your placement office, or leave blank to match a verified college domain." />
        </>
      ) : (
        <>
          <Input id="institution_name" name="institution_name" label="Institution name" required maxLength={200} />
          <Input id="institution_code" name="institution_code" label="Institution code" hint="Lowercase letters, numbers, and hyphens." required pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" />
          <Input id="institutional_email" name="institutional_email" type="email" label="Institutional administrator email" required autoComplete="email" />
          <Input id="domain" name="domain" label="Institution domain" placeholder="college.edu" required />
          <Alert tone="info">Registration does not grant administrator access. CampusHire verifies the domain, reviews duplicates, and sends an owner invitation after approval. MFA is then required.</Alert>
        </>
      )}
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : role === "student" ? "Verify student identity" : "Request T&P access"}</Button>
    </form>
  );
}
