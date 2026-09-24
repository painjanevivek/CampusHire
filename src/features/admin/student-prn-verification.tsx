"use client";

import { useState, type FormEvent } from "react";

import { ApiError, csrfRequest } from "@/lib/api/client";

type VerificationResponse = { student_id: string; verified: boolean; verified_at: string };

export function StudentPrnVerification({
  institutionId,
  studentId,
}: {
  institutionId: string;
  studentId: string;
}) {
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      await csrfRequest<VerificationResponse>(
        `/institutions/${institutionId}/students/${studentId}/prn-verification`,
        {
          method: "POST",
          body: JSON.stringify({
            official_prn: values.get("official_prn"),
            reason: values.get("reason"),
          }),
        },
      );
      setVerified(true);
      setMessage("PRN verified and recorded in Audit.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "PRN verification could not be completed.");
    }
  }

  return (
    <details>
      <summary>{verified ? "PRN verified" : "Verify PRN"}</summary>
      {verified ? <p>{message}</p> : (
        <form onSubmit={(event) => void submit(event)}>
          <p>Compare the official institutional record with the PRN saved on the student profile.</p>
          <label>
            Official PRN
            <input name="official_prn" required minLength={4} maxLength={64} pattern="1[0-9]{2}[A-Za-z0-9]+" />
          </label>
          <label>
            Audit reason
            <input name="reason" required minLength={10} maxLength={500} />
          </label>
          {message ? <p role="status">{message}</p> : null}
          <button type="submit">Confirm against official record</button>
        </form>
      )}
    </details>
  );
}
