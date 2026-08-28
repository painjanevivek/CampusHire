"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";

type User = { id: string; email: string; role: string };
type SignInResponse = { user: User; next_step: "complete" | "mfa_setup" | "mfa_challenge" };

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: "sign-up" | "sign-in";
  redirectTo?: string;
}) {
  const router = useRouter();
  const creating = mode === "sign-up";
  const [status, setStatus] = useState<"idle" | "submitting" | "complete">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("submitting");
    const data = new FormData(event.currentTarget);
    try {
      const result = await csrfRequest<User | SignInResponse>(creating ? "/auth/signup" : "/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      setStatus("complete");
      if (!creating && "next_step" in result) {
        if (result.next_step === "mfa_setup") return router.push("/admin/mfa/setup");
        if (result.next_step === "mfa_challenge") return router.push("/admin/mfa/challenge");
      }
      router.push(redirectTo ?? (creating ? "/onboarding" : "/dashboard"));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "complete") {
    return <Alert tone="success"><strong>{creating ? "Account created." : "Signed in."}</strong> Your secure session is ready.</Alert>;
  }

  return (
    <form className="authForm" onSubmit={submit} noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Input id="email" name="email" type="email" label="College email" autoComplete="email" required placeholder="you@college.edu" />
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete={creating ? "new-password" : "current-password"}
        minLength={creating ? 12 : 1}
        maxLength={128}
        required
        hint={creating ? "Use 12 or more characters. Passphrases work well." : undefined}
      />
      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Checking securely…" : creating ? "Create account" : "Sign in"}
      </Button>
      {!creating ? <a className="textLink" href="/forgot-password">Forgot password?</a> : null}
    </form>
  );
}
