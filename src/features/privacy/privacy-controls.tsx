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
        body: JSON.stringify({ confirmation: value }),
      });
      setState("complete");
      setMessage(`${response.message} Reference ${response.id.slice(0, 8)}.`);
    } catch (error) {
      setState("idle");
      if (error instanceof ApiError && error.status === 409) {
        setMessage(
          "An application decision record is under institutional retention. Contact your placement cell to review the applicable policy and deletion scope.",
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
          CampusHire separates authoritative records, derived guidance, and human decisions so each can be explained and governed.
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
          <h2>Purpose-limited evidence</h2>
          <p>Profile, academic, resume, and application data support campus recruitment, eligibility explanations, role relevance, and approved roadmaps.</p>
        </article>
      </section>

      <section className={styles.choices}>
        <div>
          <p>Your choices</p>
          <h2>Optional evidence stays optional.</h2>
          <span>GitHub, portfolio, phone, and an initial resume upload remain optional unless a published role states a reviewed requirement. Ask your placement cell about correction, export, policy retention, or appeals.</span>
        </div>
        <Link href="/onboarding">Review profile evidence</Link>
      </section>

      <section className={styles.danger} aria-labelledby="deletion-title">
        <div>
          <Trash2 aria-hidden="true" />
          <p>Irreversible action</p>
          <h2 id="deletion-title">Delete eligible student data</h2>
          <span>
            This removes your profile, sessions, resume records, readiness progress, saved roles, notifications, and derived match evidence. Private files are queued for retryable cleanup. Submitted application records can create an explicit institutional retention hold.
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
