"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";

export function PasswordResetForm({ token }: { token?: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "complete">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await csrfRequest(token ? `/auth/password-reset/${encodeURIComponent(token)}/confirm` : "/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify(token ? { password: data.get("password") } : { email: data.get("email") }),
      });
      setStatus("complete");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check your connection and try again.");
      setStatus("idle");
    }
  }
  if (status === "complete") return <Alert tone="success">{token ? "Password changed. You can sign in now." : "If the account exists, reset instructions will be sent."}</Alert>;
  return (
    <form className="authForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {token
        ? <Input id="password" name="password" type="password" label="New password" autoComplete="new-password" minLength={12} maxLength={128} required />
        : <Input id="email" name="email" type="email" label="Account email" autoComplete="email" required />}
      <Button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Working securely…" : token ? "Change password" : "Send reset instructions"}</Button>
    </form>
  );
}
