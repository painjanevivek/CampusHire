"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  Plus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type { PolicyAnswer, PolicyDocument } from "./types";
import styles from "./admin-policies.module.css";

function parseSections(value: string) {
  return value
    .split("\n")
    .map((line, index) => ({
      section: `Section ${index + 1}`,
      page: index + 1,
      text: line.trim(),
    }))
    .filter((item) => item.text.length > 0);
}

export function AdminPolicies() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [answer, setAnswer] = useState<PolicyAnswer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setPolicies(
        await apiRequest<PolicyDocument[]>("/admin/intelligence/policies", {
          cache: "no-store",
        }),
      );
    } catch {
      setError(
        "Policy records could not be loaded. Existing placement rules remain available.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const created = await csrfRequest<PolicyDocument>(
        "/admin/intelligence/policies",
        {
          method: "POST",
          body: JSON.stringify({
            title: form.get("title"),
            source_reference: form.get("source_reference"),
            sections: parseSections(String(form.get("sections") || "")),
          }),
        },
      );
      setPolicies((current) => [created, ...current]);
      setShowCreate(false);
      setNotice(
        `Policy version ${created.version} is staged for human review. It is not searchable yet.`,
      );
    } catch {
      setError(
        "The draft was not created. Add a source reference and at least one policy section.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function review(
    policy: PolicyDocument,
    action: "approve" | "reject" | "retire",
  ) {
    const reason = window
      .prompt(`Reason required to ${action} ${policy.title} v${policy.version}`)
      ?.trim();
    if (!reason) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest(`/admin/intelligence/policies/${policy.id}/review`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      setNotice(
        `Policy version ${policy.version} ${action === "approve" ? "approved for grounded retrieval" : `${action}d`}.`,
      );
      await load();
    } catch {
      setError(
        "The review decision was rejected. Refresh the policy state before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const question = String(
      new FormData(event.currentTarget).get("question") || "",
    );
    try {
      setAnswer(
        await apiRequest<PolicyAnswer>("/admin/intelligence/policies/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }),
      );
    } catch {
      setError(
        "Grounded policy evidence could not be retrieved. Review the approved source directly.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className={styles.page} aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p>Approved evidence</p>
          <h1>Policy answers with a source trail.</h1>
          <span>
            Only reviewed versions enter retrieval. Deterministic eligibility
            remains the authority.
          </span>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}>
          <Plus aria-hidden="true" />
          Add policy version
        </button>
      </header>
      <Alert>
        <ShieldCheck aria-hidden="true" />
        Draft and rejected material cannot support a decision. Every review
        records its actor, reason, and version.
      </Alert>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}

      {showCreate && (
        <form className={styles.editor} onSubmit={create}>
          <div>
            <p>New source</p>
            <h2>Stage a policy version</h2>
          </div>
          <Input
            id="policy-title"
            name="title"
            label="Policy title"
            required
            minLength={3}
          />
          <Input
            id="policy-source"
            name="source_reference"
            label="Authoritative source reference"
            required
            minLength={3}
          />
          <label className={styles.wide}>
            <span>Reviewed source sections</span>
            <textarea
              name="sections"
              rows={6}
              required
              placeholder="Enter one bounded section per line"
            />
            <small>
              Each line becomes a separately cited section. Never paste student
              data.
            </small>
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Staging…" : "Create draft"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.layout}>
        <section className={styles.catalog} aria-labelledby="policy-catalog">
          <div className={styles.sectionHead}>
            <h2 id="policy-catalog">Policy versions</h2>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh policies"
            >
              <RefreshCcw aria-hidden="true" />
            </button>
          </div>
          {!loading && !policies.length ? (
            <EmptyState title="No policy versions">
              <span>
                Stage a reviewed institutional source before using grounded
                answers.
              </span>
            </EmptyState>
          ) : null}
          <div className={styles.rows}>
            {policies.map((policy) => (
              <article key={policy.id}>
                <div className={styles.policyIcon}>
                  <BookOpenCheck aria-hidden="true" />
                </div>
                <div>
                  <p>{policy.source_reference}</p>
                  <h3>{policy.title}</h3>
                  <span>
                    {policy.sections.length} cited sections · version{" "}
                    {policy.version}
                  </span>
                </div>
                <Badge
                  tone={
                    policy.status === "approved"
                      ? "success"
                      : policy.status === "rejected"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {policy.status}
                </Badge>
                <div className={styles.rowActions}>
                  {policy.status === "draft" ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => void review(policy, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void review(policy, "approve")}
                      >
                        Approve
                      </button>
                    </>
                  ) : null}
                  {policy.status === "approved" ? (
                    <button
                      disabled={busy}
                      onClick={() => void review(policy, "retire")}
                    >
                      Retire
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.query}>
          <div>
            <FileSearch aria-hidden="true" />
            <p>Grounded lookup</p>
            <h2>Ask the approved record</h2>
          </div>
          <form onSubmit={ask}>
            <label>
              <span>Policy question</span>
              <textarea
                name="question"
                rows={4}
                required
                minLength={3}
                placeholder="What evidence is required when attendance data is missing?"
              />
            </label>
            <button
              type="submit"
              disabled={
                busy || !policies.some((item) => item.status === "approved")
              }
            >
              {busy ? "Checking…" : "Find cited evidence"}
            </button>
          </form>
          {answer ? (
            <div
              className={answer.grounded ? styles.answer : styles.ungrounded}
            >
              <h3>
                {answer.grounded ? (
                  <>
                    <CheckCircle2 aria-hidden="true" />
                    Grounded answer
                  </>
                ) : (
                  "Evidence not found"
                )}
              </h3>
              <p>{answer.answer}</p>
              {answer.citations.map((citation) => (
                <code key={citation}>{citation}</code>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
