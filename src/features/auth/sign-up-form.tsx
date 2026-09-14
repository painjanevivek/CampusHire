"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { RegistrationStartResponse } from "@/lib/api/generated/types.gen";

export function SignUpForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const repeatedPassword = String(data.get("re_enter_password") ?? "");

    setError("");
    setMessage("");
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
          password,
          re_enter_password: repeatedPassword,
        }),
      });
      if (result.next_path) {
        window.location.assign(result.next_path);
        return;
      }
      setMessage(result.message);
      form.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Registration could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm studentSignUpForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}

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

      <div className="signUpFieldPair">
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <Input
          id="re_enter_password"
          name="re_enter_password"
          type="password"
          label="Re-enter password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          error={passwordError}
          onChange={() => passwordError && setPasswordError("")}
        />
      </div>

      <Button type="submit" disabled={busy} aria-busy={busy}>
        Sign Up
      </Button>
    </form>
  );
}
