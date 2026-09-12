"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { ApiError, csrfRequest } from "@/lib/api/client";

export function InstitutionVerification({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "complete">("idle");
  const [error, setError] = useState("");

  async function verify() {
    setState("busy");
    setError("");
    try {
      await csrfRequest("/auth/institution-registrations/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setState("complete");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Verification could not be completed.");
      setState("idle");
    }
  }

  if (state === "complete") {
    return <Alert tone="success"><strong>Email verified.</strong> Your request is pending CampusHire operator approval. No administrator access has been granted yet.</Alert>;
  }
  return (
    <div className="authForm">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="button" onClick={() => void verify()} disabled={state === "busy"}>
        {state === "busy" ? "Verifying…" : "Verify institutional email"}
      </Button>
    </div>
  );
}
