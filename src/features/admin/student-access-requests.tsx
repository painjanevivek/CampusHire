"use client";

import { useState, type SyntheticEvent } from "react";

import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { StudentAccessRequestSummary } from "@/lib/api/generated";
import styles from "./admin-students.module.css";

export function StudentAccessRequests({ institutionId }: { institutionId: string }) {
  const [requests, setRequests] = useState<StudentAccessRequestSummary[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    setMessage("");
    try {
      setRequests(await apiRequest<StudentAccessRequestSummary[]>(
        `/institutions/${institutionId}/student-access-requests`,
        { cache: "no-store" },
      ));
      setState("ready");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Access requests could not be loaded.");
      setState("error");
    }
  }

  function disclose(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) void load();
  }

  return (
    <details className={styles.invitationDisclosure} onToggle={disclose}>
      <summary>
        <span>
          <strong>Student access requests</strong>
          <small>Code-free requests are unverified. Check the student against your approved roster before issuing a one-time invitation.</small>
        </span>
        {state === "ready" ? <Badge>{requests.length} pending</Badge> : null}
      </summary>
      <div className={styles.invitationContent}>
        {state === "loading" ? <RequestState state="loading" title="Loading access requests">Checking requests for this institution.</RequestState> : null}
        {state === "error" ? <Alert tone="error">{message}</Alert> : null}
        {state === "ready" && !requests.length ? <RequestState state="empty" title="No pending requests">Students without a code can request review here.</RequestState> : null}
        {state === "ready" && requests.length ? (
          <>
            <p>These requests do not prove email ownership or enrollment. Verify each student through an approved channel, then use the roster import above to issue a one-time code through your secure handoff process.</p>
            <ul className={styles.invitationList}>
              {requests.map((request) => (
                <li key={request.id}>
                  <strong>{request.email}</strong>
                  <time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time>
                  <Badge tone="warning">Unverified</Badge>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </details>
  );
}
