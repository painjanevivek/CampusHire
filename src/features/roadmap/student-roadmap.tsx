"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Circle, LockKeyhole, Route } from "lucide-react";

import { Alert, EmptyState } from "@/components/ui/feedback";
import type {
  Roadmap,
  RoadmapNode,
  RoadmapTemplate,
} from "@/features/engagement/types";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./student-roadmap.module.css";

export function StudentRoadmap() {
  const [templates, setTemplates] = useState<RoadmapTemplate[]>([]);
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
        apiRequest<RoadmapTemplate[]>("/roadmaps/templates", {
          cache: "no-store",
        }),
        apiRequest<Roadmap | null>("/roadmaps/current", { cache: "no-store" }),
      ]);
      setTemplates(options);
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
        "Roadmap selected. Its approved version and prerequisite sequence are now fixed for this progress record.",
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
        `${node.title} marked complete with reviewed evidence metadata.`,
      );
    } catch {
      setError(
        "Progress was not saved. Complete its prerequisites and use a safe internal evidence link.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <main id="main-content" className={styles.state} aria-busy="true">
        <p>Loading approved career paths…</p>
      </main>
    );

  if (!roadmap)
    return (
      <main id="main-content" className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p>Reviewed curricula</p>
            <h1>Choose one career roadmap</h1>
            <span>
              Each path is versioned, acyclic, and limited to approved
              milestones.
            </span>
          </div>
          <div className={styles.score}>
            <strong>08</strong>
            <span>
              curated
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
        {!templates.length ? (
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
          <p>Evidence sequence · version {roadmap.version}</p>
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
                    : "Prerequisites required"}
              </p>
              <h2>{node.title}</h2>
              <span>{node.completion}</span>
            </div>
            <span className={styles.meta}>
              {node.state === "completed"
                ? "EVIDENCE ATTACHED"
                : node.state === "next"
                  ? "NEXT MILESTONE"
                  : `${node.prerequisites.length} PREREQUISITES`}
            </span>
            {node.state === "next" && (
              <button
                type="button"
                className={styles.action}
                onClick={() => setEvidenceNode(node)}
              >
                Attach evidence
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
            <p>Evidence for</p>
            <h2>{evidenceNode.title}</h2>
            <span>{evidenceNode.completion}</span>
          </div>
          <label>
            Evidence label
            <input
              name="evidence_label"
              required
              minLength={3}
              placeholder="Reviewed project or resume section"
            />
          </label>
          <label>
            Internal evidence link
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
          <strong>Your roadmap is evidence-led.</strong>
          <p>
            Completing a milestone records evidence metadata; it does not claim
            proficiency or predict hiring.
          </p>
        </div>
      </aside>
    </main>
  );
}
