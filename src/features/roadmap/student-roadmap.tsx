"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle, LockKeyhole, Route } from "lucide-react";

import { Alert, EmptyState } from "@/components/ui/feedback";
import type {
  Roadmap,
  RoadmapAvailability,
  RoadmapNode,
  RoadmapTemplate,
} from "@/features/engagement/types";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./student-roadmap.module.css";

export function StudentRoadmap() {
  const [templates, setTemplates] = useState<RoadmapTemplate[]>([]);
  const [availability, setAvailability] = useState<RoadmapAvailability | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [evidenceNode, setEvidenceNode] = useState<RoadmapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [options, current] = await Promise.all([
        apiRequest<RoadmapAvailability>("/roadmaps/availability", {
          cache: "no-store",
        }),
        apiRequest<Roadmap | null>("/roadmaps/current", { cache: "no-store" }),
      ]);
      setAvailability(options);
      setTemplates(options.templates);
      setRoadmap(current);
    } catch {
      setError(
        "Your roadmap could not be loaded. Existing progress remains saved.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function choose(templateId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setRoadmap(
        await csrfRequest<Roadmap>("/roadmaps/select", {
          method: "POST",
          body: JSON.stringify({ template_id: templateId }),
        }),
      );
      setNotice(
        "Roadmap selected. This approved version and step order are now saved to your progress.",
      );
    } catch {
      setError(
        "The roadmap could not be selected. Refresh the approved template list and retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete(node: RoadmapNode, form: HTMLFormElement) {
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(form);
    try {
      setRoadmap(
        await csrfRequest<Roadmap>(`/roadmaps/nodes/${node.key}`, {
          method: "POST",
          body: JSON.stringify({
            completed: true,
            evidence_label: data.get("evidence_label") || null,
            evidence_reference: data.get("evidence_reference") || null,
          }),
        }),
      );
      setEvidenceNode(null);
      setNotice(
        `${node.title} marked complete with your saved details.`,
      );
    } catch {
      setError(
        "Progress was not saved. Finish the required earlier steps and use a safe CampusHire link.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <main id="main-content" className={styles.state} aria-busy="true">
        <div role="status">
          <h1>Career roadmap</h1>
          <p>Loading approved career paths…</p>
        </div>
      </main>
    );

  if (!roadmap)
    return (
      <main id="main-content" className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p>Reviewed learning paths</p>
            <h1>Choose one career roadmap</h1>
            <span>
              Each path has a clear order and uses only approved milestones.
            </span>
          </div>
          <div className={styles.score}>
            <strong>08</strong>
            <span>
              reviewed
              <br />
              paths
            </span>
          </div>
        </header>
        {error && (
          <Alert tone="error">
            {error}{" "}
            <button type="button" onClick={() => void load()}>
              Retry
            </button>
          </Alert>
        )}
        {availability?.guidance_provider_status === "unavailable" ? <Alert tone="warning">AI guidance is unavailable. Approved roadmaps and your step progress still work normally.</Alert> : null}
        {availability && availability.status !== "available" ? <EmptyState title={availability.status === "no_target_role" ? "Choose a target role first" : availability.status === "institution_restriction" ? "Roadmaps are restricted" : "No approved path for this role"}><span>{availability.reason}</span>{availability.status === "no_target_role" ? <Link href="/profile">Open profile settings</Link> : null}</EmptyState> : null}
        <section
          className={styles.templateGrid}
          aria-label="Approved career paths"
        >
          {templates.map((template) => (
            <article key={template.id}>
              <p>
                Version {template.version} · {template.node_count} milestones
              </p>
              <h2>{template.title}</h2>
              <span>{template.summary}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void choose(template.id)}
              >
                Choose this path
              </button>
            </article>
          ))}
        </section>
        {!templates.length && availability?.status === "available" ? (
          <EmptyState title="No approved paths">
            <span>
              The placement cell has not published a roadmap version yet.
            </span>
          </EmptyState>
        ) : null}
      </main>
    );

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p>Learning path · version {roadmap.version}</p>
          <h1>{roadmap.title}</h1>
          <span>{roadmap.summary}</span>
        </div>
        <div className={styles.score}>
          <strong>{String(roadmap.completed_count).padStart(2, "0")}</strong>
          <span>
            of {String(roadmap.nodes.length).padStart(2, "0")}
            <br />
            confirmed
          </span>
        </div>
      </header>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {availability?.guidance_provider_status === "unavailable" ? <Alert tone="warning">AI guidance is unavailable. Your saved roadmap progress and readiness details are still available.</Alert> : null}
      <section
        className={styles.timeline}
        aria-label={`${roadmap.title} roadmap`}
      >
        {roadmap.nodes.map((node, index) => (
          <article
            key={node.key}
            className={styles[node.state === "completed" ? "done" : node.state]}
          >
            <div className={styles.sequence}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </div>
            <span className={styles.icon} aria-hidden="true">
              {node.state === "completed" ? (
                <Check />
              ) : node.state === "next" ? (
                <Circle />
              ) : (
                <LockKeyhole />
              )}
            </span>
            <div className={styles.copy}>
              <p>
                {node.state === "completed"
                  ? "Confirmed"
                  : node.state === "next"
                    ? "Available now"
                    : "Earlier steps required"}
              </p>
              <h2>{node.title}</h2>
              <span>{node.completion}</span>
            </div>
            <span className={styles.meta}>
              {node.state === "completed"
                ? "DETAILS ADDED"
                : node.state === "next"
                  ? "NEXT MILESTONE"
                  : `${node.prerequisites.length} EARLIER STEPS`}
            </span>
            {node.state === "next" && (
              <button
                type="button"
                className={styles.action}
                onClick={() => setEvidenceNode(node)}
              >
                Add completion details
              </button>
            )}
          </article>
        ))}
      </section>
      {evidenceNode ? (
        <form
          className={styles.evidenceEditor}
          onSubmit={(event) => {
            event.preventDefault();
            void complete(evidenceNode, event.currentTarget);
          }}
        >
          <div>
            <p>Completion details for</p>
            <h2>{evidenceNode.title}</h2>
            <span>{evidenceNode.completion}</span>
          </div>
          <label>
            What did you complete?
            <input
              name="evidence_label"
              required
              minLength={3}
              placeholder="Reviewed project or resume section"
            />
          </label>
          <label>
            CampusHire link
            <input
              name="evidence_reference"
              placeholder="/resume"
              pattern="^/(?!/).*"
            />
          </label>
          <div>
            <button type="button" onClick={() => setEvidenceNode(null)}>
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Confirm milestone"}
            </button>
          </div>
        </form>
      ) : null}
      <aside className={styles.note}>
        <Route size={20} aria-hidden="true" />
        <div>
          <strong>Your roadmap is based on completed work.</strong>
          <p>
            Completing a milestone saves the details you provide. It does not
            claim a skill level or predict hiring.
          </p>
        </div>
      </aside>
    </main>
  );
}
