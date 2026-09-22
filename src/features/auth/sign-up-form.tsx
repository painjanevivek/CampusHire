"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { RegistrationStartResponse } from "@/lib/api/generated/types.gen";

export function SignUpForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const repeatedPassword = String(data.get("re_enter_password") ?? "");

    setError("");
    setNotice("");
    setPasswordError("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (password !== repeatedPassword) {
      setPasswordError("Passwords do not match.");
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
          invitation_code: String(data.get("invitation_code") ?? "").trim() || null,
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
      <Input id="email" name="email" type="email" label="Email" autoComplete="email" required />
      <Input
        id="invitation_code"
        name="invitation_code"
        label="Invitation code (optional)"
        autoComplete="off"
        minLength={20}
        maxLength={200}
        hint="Have a code from your placement office? Enter it to activate now. Without one, your college must verify your request and provide a code later."
      />

      <div className="signUpFieldPair">
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <PasswordInput
          id="re_enter_password"
          name="re_enter_password"
          label="Re-enter password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          error={passwordError}
          onChange={() => passwordError && setPasswordError("")}
        />
      </div>

      <label className="signUpConsent">
        <input name="accept" type="checkbox" required />
        <span>I accept the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.</span>
      </label>
      <Button type="submit" disabled={busy} aria-busy={busy}>
        Sign Up
      </Button>
    </form>
  );
}
