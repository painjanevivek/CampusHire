"use client";

import { useCallback, useState, type FormEvent, type SyntheticEvent } from "react";

import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type {
  InvitationActionResponse,
  InvitationSummary,
} from "@/lib/api/generated";
import styles from "./admin-students.module.css";

type Invitation = InvitationSummary;
type InvitationAction = InvitationActionResponse;

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

export function InvitationQueue({ institutionId }: { institutionId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      setInvitations(await apiRequest<Invitation[]>(
        `/institutions/${institutionId}/invitations`,
        { cache: "no-store" },
      ));
      setState("ready");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Invitations could not be loaded.");
      setState("error");
    }
  }, [institutionId]);

  function disclose(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open && state === "idle") void load();
  }

  async function resend(invitation: Invitation) {
    if (!window.confirm(`Send a replacement invitation to ${invitation.email}?`)) return;
    setBusyId(invitation.id);
    setMessage("");
    try {
      const result = await csrfRequest<InvitationAction>(
        `/institutions/${institutionId}/invitations/${invitation.id}/resend`,
        { method: "POST" },
      );
      setInvitations((items) => items.map((item) => item.id === invitation.id ? {
        ...item,
        status: result.status,
        expires_at: result.expires_at,
        resend_count: item.resend_count + 1,
      } : item));
      setFeedbackTone("success");
      setMessage(result.message);
    } catch (cause) {
      setFeedbackTone("error");
      setMessage(cause instanceof ApiError ? cause.message : "The invitation was not resent.");
    } finally {
      setBusyId("");
    }
  }

  async function revoke(event: FormEvent<HTMLFormElement>, invitation: Invitation) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setBusyId(invitation.id);
    setMessage("");
    try {
      const result = await csrfRequest<InvitationAction>(
        `/institutions/${institutionId}/invitations/${invitation.id}/revoke`,
        { method: "POST", body: JSON.stringify({ reason }) },
      );
      setInvitations((items) => items.map((item) => item.id === invitation.id ? {
        ...item,
        status: result.status,
      } : item));
      setFeedbackTone("success");
      setMessage(result.message);
    } catch (cause) {
      setFeedbackTone("error");
      setMessage(cause instanceof ApiError ? cause.message : "The invitation was not revoked.");
    } finally {
      setBusyId("");
    }
  }

  const actionable = invitations.filter((item) => item.status === "pending" || item.status === "expired");

  return (
    <details className={styles.invitationDisclosure} onToggle={disclose}>
      <summary>
        <span><strong>Invitation queue</strong><small>Resend expired links or revoke records added in error.</small></span>
        {state === "ready" ? <Badge>{actionable.length} need attention</Badge> : null}
      </summary>
      <div className={styles.invitationContent}>
        {message && state === "ready" ? <Alert tone={feedbackTone}>{message}</Alert> : null}
        {state === "loading" ? <RequestState state="loading" title="Loading invitations">Checking the latest tenant-scoped invitation records.</RequestState> : null}
        {state === "error" ? <RequestState state="error" title="Invitations are unavailable" onRetry={() => void load()}>{message}</RequestState> : null}
        {state === "ready" && !invitations.length ? <RequestState state="empty" title="No invitations yet">Commit a validated roster to create student invitations.</RequestState> : null}
        {state === "ready" && invitations.length ? (
          <ul className={styles.invitationList}>
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <div className={styles.invitationIdentity}>
                  <strong>{invitation.full_name || invitation.email}</strong>
                  <span>{invitation.email} · {invitation.enrollment_id || "No enrollment ID"}</span>
                  <small>Expires {formatDate(invitation.expires_at)} · Resent {invitation.resend_count} times</small>
                </div>
                <Badge tone={invitation.status === "accepted" ? "success" : invitation.status === "pending" ? undefined : "warning"}>{invitation.status}</Badge>
                {invitation.status === "pending" || invitation.status === "expired" ? (
                  <div className={styles.invitationActions}>
                    <button type="button" disabled={busyId === invitation.id} onClick={() => void resend(invitation)}>Resend</button>
                    <details>
                      <summary>Revoke</summary>
                      <form onSubmit={(event) => void revoke(event, invitation)}>
                        <label>
                          Audit reason
                          <input name="reason" required minLength={3} maxLength={500} />
                        </label>
                        <button type="submit" disabled={busyId === invitation.id}>Confirm revocation</button>
                      </form>
                    </details>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}
