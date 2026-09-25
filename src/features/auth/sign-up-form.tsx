"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type { RegistrationStartResponse, SignupInstitution } from "@/lib/api/generated/types.gen";

export function SignUpForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [repeatedPasswordError, setRepeatedPasswordError] = useState("");
  const [institutions, setInstitutions] = useState<SignupInstitution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState("");
  const [institutionLoadAttempt, setInstitutionLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<SignupInstitution[]>("/auth/signup/institutions", {
      signal: controller.signal,
    })
      .then(setInstitutions)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setInstitutionsError(
            cause instanceof ApiError ? cause.message : "College options could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setInstitutionsLoading(false);
      });

    return () => controller.abort();
  }, [institutionLoadAttempt]);

  function retryInstitutionLoad() {
    setInstitutionsError("");
    setInstitutionsLoading(true);
    setInstitutionLoadAttempt((attempt) => attempt + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const repeatedPassword = String(data.get("re_enter_password") ?? "");

    setError("");
    setNotice("");
    setPasswordError("");
    setRepeatedPasswordError("");

    if (Array.from(password).length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }
    if (Array.from(repeatedPassword).length < 8) {
      setRepeatedPasswordError("Use at least 8 characters.");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (password !== repeatedPassword) {
      setRepeatedPasswordError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await csrfRequest<RegistrationStartResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          surname: data.get("surname"),
          dob: data.get("dob"),
          email: data.get("email"),
          institution_id: data.get("institution_id"),
          password,
          re_enter_password: repeatedPassword,
          terms_version: "2026-08-28",
          privacy_version: "2026-08-28",
        }),
      });
      if (result.next_path) {
        router.push(result.next_path);
        return;
      }
      if (result.status === "approval_pending") {
        setNotice(result.message);
      } else {
        setError(result.message);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Registration could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm studentSignUpForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="signUpFieldPair">
        <Input
          id="name"
          name="name"
          label="Name"
          autoComplete="given-name"
          minLength={1}
          maxLength={100}
          required
        />
        <Input
          id="surname"
          name="surname"
          label="Surname"
          autoComplete="family-name"
          minLength={1}
          maxLength={100}
          required
        />
      </div>

      <Input id="dob" name="dob" type="date" label="DOB" autoComplete="bday" required />
      <Input
        id="email"
        name="email"
        type="email"
        label="PCCOE institutional email"
        autoComplete="email"
        hint="Student registration is currently open for PCCOE only. Use your PCCOE email with its admission batch year."
        required
      />
      <Select
        id="institution_id"
        name="institution_id"
        label="College"
        hint="Other colleges are listed for future availability."
        required
        disabled={institutionsLoading || Boolean(institutionsError) || institutions.length === 0}
      >
        <option value="">{institutionsLoading ? "Loading colleges…" : "Select your college"}</option>
        {institutions.map((institution) => (
          <option
            key={institution.id}
            value={institution.id}
            disabled={!institution.signup_enabled}
          >
            {institution.name}
          </option>
        ))}
      </Select>
      {institutionsError ? <>
        <Alert tone="error">{institutionsError}</Alert>
        <Button type="button" variant="quiet" onClick={retryInstitutionLoad}>Retry college options</Button>
      </> : null}
      {!institutionsLoading && !institutionsError && institutions.length === 0 ? (
        <Alert tone="info">No colleges are available for registration yet.</Alert>
      ) : null}

      <div className="signUpFieldPair">
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          hint="Use at least 8 characters."
          error={passwordError}
          required
          onChange={() => passwordError && setPasswordError("")}
        />
        <PasswordInput
          id="re_enter_password"
          name="re_enter_password"
          label="Re-enter password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          error={repeatedPasswordError}
          required
          onChange={() => repeatedPasswordError && setRepeatedPasswordError("")}
        />
      </div>

      <label className="signUpConsent">
        <input name="accept" type="checkbox" required />
        <span>I accept the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.</span>
      </label>
      <Button
        type="submit"
        disabled={busy || institutionsLoading || Boolean(institutionsError) || institutions.length === 0}
        aria-busy={busy}
      >
        Sign Up
      </Button>
    </form>
  );
}
