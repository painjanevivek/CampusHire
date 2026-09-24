"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, csrfRequest } from "@/lib/api/client";
import { staffMfaSetupPath } from "@/lib/auth/post-auth-route";
import type { SignInRequest, SignInResponse } from "@/lib/api/generated/types.gen";

type SignInWorkspace = NonNullable<SignInRequest["workspace"]>;

export function AuthForm({
  redirectTo,
  workspace,
}: {
  redirectTo?: string;
  workspace: SignInWorkspace;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "password" | "complete">("idle");
  const [error, setError] = useState("");

  async function authenticate(body: SignInRequest) {
    setError("");
    setStatus("password");
    try {
      const result = await csrfRequest<SignInResponse>("/auth/sign-in", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setStatus("complete");
      if (result.next_step === "terms_acceptance") return router.push("/accept-terms");
      if (result.next_step === "mfa_setup") return router.push(result.user.workspace === "student" ? "/student/mfa/setup" : staffMfaSetupPath(result.user.workspace));
      if (result.next_step === "mfa_challenge") return router.push(result.user.workspace === "student" ? "/student/mfa/challenge" : result.user.workspace === "tnp" ? "/tnp/mfa/challenge" : "/admin/mfa/challenge");
      router.push(redirectTo ?? "/dashboard");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check your connection and try again.");
      setStatus("idle");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await authenticate({
      identifier: String(data.get("identifier") ?? ""),
      password: String(data.get("password") ?? ""),
      workspace,
    });
  }

  if (status === "complete") {
    return <Alert tone="success"><strong>Signed in.</strong> Your secure session is ready.</Alert>;
  }

  const isStudent = workspace === "student";

  return (
    <form className="authForm" onSubmit={submit} noValidate autoComplete="off">
      {error && <Alert tone="error">{error}</Alert>}
      <Input
        id="identifier"
        name="identifier"
        type={isStudent ? "email" : "text"}
        label={isStudent ? "College email" : "Username"}
        autoComplete={isStudent ? "email" : "username"}
        required
        placeholder={isStudent ? "name.surname23@pccoepune.org" : "Enter your username"}
      />
      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete={isStudent ? "current-password" : "off"}
        minLength={1}
        maxLength={128}
        required
      />
      <Button type="submit" disabled={status !== "idle"}>
        {status === "password" ? "Checking securely…" : "Sign in"}
      </Button>
      <Link className="textLink" href="/forgot-password">Forgot password?</Link>
    </form>
  );
}
