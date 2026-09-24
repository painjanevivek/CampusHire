"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, RequestState } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import type { MfaStatusResponse } from "@/lib/api/generated/types.gen";
import { MfaResetControl } from "./mfa-reset-control";
import styles from "./profile-workspace.module.css";

export function MfaStatusControl({ workspace = "admin" }: { workspace?: "student" | "tnp" | "admin" }) {
  const accountLabel = workspace === "student" ? "student account" : workspace === "tnp" ? "T&P account" : "administrator account";
  const setupPath = workspace === "student" ? "/student/mfa/setup?next=/profile" : workspace === "tnp" ? "/tnp/mfa/setup?next=/tnp/account" : "/admin/mfa/setup?next=/admin/account";
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled" | "error">("loading");

  useEffect(() => {
    let active = true;
    void apiRequest<MfaStatusResponse>("/auth/mfa/status", { cache: "no-store" }).then((result) => {
      if (active) setStatus(result.enabled ? "enabled" : "disabled");
    }).catch(() => {
      if (active) setStatus("error");
    });
    return () => { active = false; };
  }, []);

  if (status === "loading") return <RequestState state="loading" title="Checking authenticator status">Reading the active security factor for this account.</RequestState>;
  if (status === "error") return <RequestState state="error" title="Authenticator status unavailable">Reload the page before changing this security setting.</RequestState>;
  if (status === "enabled") {
    return (
      <div className={styles.governanceContent}>
        <Alert tone="success">Authenticator enabled. CampusHire will request a rotating code on future sign-ins to this {accountLabel}.</Alert>
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
