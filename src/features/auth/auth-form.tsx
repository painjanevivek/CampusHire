"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { DemoSignInRequest, SignInResponse } from "@/lib/api/generated/types.gen";

type DemoRole = DemoSignInRequest["role"];

export function AuthForm({
  redirectTo,
  demoRole,
}: {
  redirectTo?: string;
  demoRole?: DemoRole;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "password" | "demo" | "complete">("idle");
  const [error, setError] = useState("");

  async function authenticate(path: string, body: Record<string, unknown>, action: "password" | "demo") {
    setError("");
    setStatus(action);
    try {
      const result = await csrfRequest<SignInResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setStatus("complete");
      if (result.next_step === "mfa_setup") return router.push("/admin/mfa/setup");
      if (result.next_step === "mfa_challenge") return router.push("/admin/mfa/challenge");
      router.push(redirectTo ?? "/dashboard");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Check your connection and try again.");
      setStatus("idle");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await authenticate(
      "/auth/sign-in",
      { email: data.get("email"), password: data.get("password") },
      "password",
    );
  }

  async function demoSignIn() {
    if (!demoRole || status !== "idle") return;
    await authenticate("/auth/demo-sign-in", { role: demoRole }, "demo");
  }

  if (status === "complete") {
    return <Alert tone="success"><strong>Signed in.</strong> Your secure session is ready.</Alert>;
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
        autoComplete="current-password"
        minLength={1}
        maxLength={128}
        required
      />
      <Button type="submit" disabled={status !== "idle"}>
        {status === "password" ? "Checking securely…" : "Sign in"}
      </Button>
      {demoRole ? (
        <>
          <div className="authDivider" aria-hidden="true"><span>or</span></div>
          <Button type="button" variant="quiet" disabled={status !== "idle"} onClick={() => void demoSignIn()}>
            {status === "demo"
              ? "Opening demo…"
              : demoRole === "student"
                ? "Use demo student account"
                : "Use demo T&P account"}
          </Button>
          <p className="demoNotice">
            {demoRole === "tnp_admin"
              ? "Testing only. Uses synthetic data and skips MFA only for this local demo."
              : "Testing only. Uses synthetic student data."}
          </p>
        </>
      ) : null}
      <a className="textLink" href="/forgot-password">Forgot password?</a>
    </form>
  );
}
