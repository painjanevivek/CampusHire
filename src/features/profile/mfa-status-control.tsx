"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, RequestState } from "@/components/ui/feedback";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { MfaStatusResponse } from "@/lib/api/generated/types.gen";
import { MfaResetControl } from "./mfa-reset-control";
import { MfaRecoveryControl } from "./mfa-recovery-control";
import styles from "./profile-workspace.module.css";

export function MfaStatusControl({ workspace = "admin" }: { workspace?: "student" | "tnp" | "admin" }) {
  const accountLabel = workspace === "student" ? "student account" : workspace === "tnp" ? "T&P account" : "administrator account";
  const setupPath = workspace === "student" ? "/student/mfa/setup?next=/profile" : workspace === "tnp" ? "/tnp/mfa/setup?next=/tnp/account" : "/admin/mfa/setup?next=/admin/account";
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled" | "error">("loading");
  const [requestError, setRequestError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    void apiRequest<MfaStatusResponse>("/auth/mfa/status", { cache: "no-store" }).then((result) => {
      if (active) setStatus(result.enabled ? "enabled" : "disabled");
    }).catch((cause: unknown) => {
      if (active) {
        setRequestError(cause instanceof ApiError ? cause.message : "The authenticator status request failed.");
        setStatus("error");
      }
    });
    return () => { active = false; };
  }, [retryCount]);

  if (status === "loading") return <RequestState state="loading" title="Checking authenticator status">Reading the active security factor for this account.</RequestState>;
  if (status === "error") {
    return (
      <div className={styles.governanceContent}>
        <RequestState state="error" title="Authenticator status unavailable">
          {requestError || "CampusHire could not read this security setting."}
        </RequestState>
        <button
          className={styles.secondaryAction}
          type="button"
          onClick={() => {
            setRequestError("");
            setStatus("loading");
            setRetryCount((count) => count + 1);
          }}
        >
          Retry status check
        </button>
      </div>
    );
  }
  if (status === "enabled") {
    return (
      <div className={styles.governanceContent}>
        <Alert tone="success">Authenticator enabled. CampusHire will request a rotating code on future sign-ins to this {accountLabel}.</Alert>
        <MfaRecoveryControl />
        <MfaResetControl workspace={workspace} />
      </div>
    );
  }
  return (
    <div className={styles.governanceContent}>
      <p>Protect this {accountLabel} with a scannable QR code, rotating authenticator codes, and one-time recovery codes.</p>
      <Link className={styles.secondaryAction} href={setupPath}>Set up MFA</Link>
    </div>
  );
}
