"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DatabaseZap, ShieldCheck, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, csrfRequest } from "@/lib/api/client";
import type { DataDeletionResponse } from "@/lib/api/generated";
import styles from "./privacy-controls.module.css";

const confirmation = "DELETE MY CAMPUSHIRE DATA";

export function PrivacyControls() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "complete">("idle");
  const [message, setMessage] = useState("");

  async function requestDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value !== confirmation) return;
    setState("submitting");
    setMessage("");
    try {
      const response = await csrfRequest<DataDeletionResponse>("/privacy/deletion-requests", {
        method: "POST",
        body: JSON.stringify({
          confirmation: value,
          scope: "account_all_memberships",
        }),
      });
      setState("complete");
      setMessage(`${response.message} Reference ${response.id.slice(0, 8)}.`);
    } catch (error) {
      setState("idle");
      if (error instanceof ApiError && error.status === 409) {
        setMessage(
          "Your college must keep an application decision record for now. Contact your placement cell to check the policy and what can be deleted.",
        );
      } else if (error instanceof ApiError && error.status === 401) {
        setMessage("Sign in with the student account whose data you want to delete.");
      } else {
        setMessage("The deletion request could not be completed. No account data was changed.");
      }
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header>
        <p>Privacy and AI assistance</p>
        <h1>Your placement data has a defined purpose.</h1>
        <span>
          CampusHire keeps official records, helpful suggestions, and human decisions separate so you can understand each one.
        </span>
      </header>

      <section className={styles.principles} aria-label="Privacy principles">
        <article>
          <ShieldCheck aria-hidden="true" />
          <h2>Review before authority</h2>
          <p>AI may extract, compare, retrieve, and suggest. It cannot silently change your resume or decide formal eligibility.</p>
        </article>
        <article>
          <DatabaseZap aria-hidden="true" />
          <h2>Data used for clear reasons</h2>
          <p>Your profile, academic, resume, and application data help with campus hiring, eligibility explanations, role matches, and approved roadmaps.</p>
        </article>
      </section>

      <section className={styles.choices}>
        <div>
          <p>Your choices</p>
          <h2>Optional details stay optional.</h2>
          <span>GitHub, portfolio, phone, and your first resume upload stay optional unless a published role clearly requires one. Ask your placement cell about corrections, exports, how long data is kept, or appeals.</span>
        </div>
        <Link href="/profile">Review profile details</Link>
      </section>

      <section className={styles.danger} aria-labelledby="deletion-title">
        <div>
          <Trash2 aria-hidden="true" />
          <p>Irreversible action</p>
          <h2 id="deletion-title">Delete eligible student data</h2>
          <span>
            This action removes data that can be deleted and memberships from every college linked to this CampusHire account. This includes your profile, sign-ins, resumes, readiness progress, saved roles, notifications, and match details. Private files are removed through a process that retries if needed. Your college may need to keep submitted application records for a set time.
          </span>
        </div>
        {message ? <Alert tone={state === "complete" ? "success" : "warning"}>{message}</Alert> : null}
        {state !== "complete" ? (
          <form onSubmit={requestDeletion}>
            <label htmlFor="deletion-confirmation">
              Type <strong>{confirmation}</strong> to confirm
            </label>
            <input
              id="deletion-confirmation"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={value !== confirmation || state === "submitting"}>
              {state === "submitting" ? "Removing eligible data…" : "Delete eligible data"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
