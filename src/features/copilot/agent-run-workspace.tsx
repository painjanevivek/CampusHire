"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Ban,
  BookOpenCheck,
  Check,
  CircleAlert,
  Clock3,
  FileSearch,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type {
  AgentEventResponse,
  AgentRunResponse,
  ArtifactResponse,
  PracticeConsentResponse,
  SourceVersionResponse,
} from "@/lib/api/generated/types.gen";
import type { Drive, OpportunityPage } from "@/features/recruitment/types";
import styles from "./agent-run-workspace.module.css";

type Audience = "student" | "tnp";
type RunStatus = AgentRunResponse["status"];

type PreparationActivity = {
  title: string;
  objective: string;
  minutes: number;
  due_offset_days: number;
  resource_source_ids: string[];
};

type PreparationContent = {
  title: string;
  summary: string;
  eligibility: {
    status: string;
    rule_version: string | null;
    reasons: string[];
    missing_evidence: string[];
  };
  priorities: Array<{
    skill: string;
    evidence_state: "recorded" | "unknown" | "assessed";
    rationale: string;
    source_ids: string[];
    activities: PreparationActivity[];
  }>;
  unresolved_questions: string[];
  total_minutes: number;
  limitations: string[];
};

type DriveContent = {
  field_proposals: Array<{
    field: string;
    proposed_value: string;
    rationale: string;
    source_ids: string[];
  }>;
  clarification_questions: string[];
  announcement_draft: string;
  blockers: Array<{
    key: string;
    description: string;
    owner_role: string;
    status: "proposed" | "open" | "resolved";
    next_action: string;
    deadline: string | null;
    source_ids: string[];
  }>;
  unresolved_work: string[];
};

type Artifact = Omit<ArtifactResponse, "content" | "evidence_references"> & {
  content: PreparationContent | DriveContent;
  evidence_references: Array<{
    source_id: string;
    version: string;
    label: string;
    access_scope: string;
  }>;
};

type AgentRun = Omit<AgentRunResponse, "artifact" | "required_action"> & {
  required_action: {
    type: "clarification" | "artifact_review";
    interrupt_id?: string;
    question?: string;
  } | null;
  artifact: Artifact | null;
};

type AgentEvent = AgentEventResponse;
type Consent = PracticeConsentResponse;
type SourceVersion = SourceVersionResponse;

const activeStatuses = new Set<RunStatus>(["queued", "running"]);
const cancellableStatuses = new Set<RunStatus>([
  "queued",
  "running",
  "awaiting_input",
  "awaiting_review",
]);
const deletableStatuses = new Set<RunStatus>(["completed", "failed", "cancelled", "expired"]);

function errorMessage(cause: unknown) {
  return cause instanceof ApiError
    ? cause.message
    : "CampusHire could not complete this preparation task.";
}

function statusLabel(status: RunStatus) {
  return status.replaceAll("_", " ");
}

export function AgentRunWorkspace({ audience }: { audience: Audience }) {
  const [opportunities, setOpportunities] = useState<OpportunityPage["items"]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [sources, setSources] = useState<SourceVersion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [goal, setGoal] = useState("Build a focused preparation plan for this opportunity");
  const [minutes, setMinutes] = useState(300);
  const [targetDate, setTargetDate] = useState("");
  const [brief, setBrief] = useState("");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [clarification, setClarification] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedAnnouncement, setEditedAnnouncement] = useState("");
  const [consent, setConsent] = useState<Consent | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const base = `/ai/${audience === "student" ? "student" : "tnp"}-copilot`;

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (audience === "student") {
        const [page, currentConsent] = await Promise.all([
          apiRequest<OpportunityPage>("/opportunities?page_size=100", { cache: "no-store" }),
          apiRequest<Consent>(`${base}/practice-consent`, { cache: "no-store" }),
        ]);
        setOpportunities(page.items);
        setConsent(currentConsent);
        const requested = new URLSearchParams(window.location.search).get("role");
        setSelectedId(
          page.items.some((item) => item.id === requested) ? requested! : page.items[0]?.id ?? "",
        );
      } else {
        const [driveItems, sourceItems] = await Promise.all([
          apiRequest<Drive[]>("/tnp/recruitment/drives", { cache: "no-store" }),
          apiRequest<SourceVersion[]>(`${base}/sources`, { cache: "no-store" }).catch(() => []),
        ]);
        setDrives(driveItems);
        setSources(sourceItems);
        const requested = new URLSearchParams(window.location.search).get("drive");
        setSelectedId(
          driveItems.some((item) => item.id === requested)
            ? requested!
            : driveItems[0]?.id ?? "",
        );
      }
      const defaultTarget = new Date();
      defaultTarget.setDate(defaultTarget.getDate() + 14);
      setTargetDate(defaultTarget.toISOString().slice(0, 10));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [audience, base]);

  const loadEvents = useCallback(async (runId: string) => {
    const items = await apiRequest<AgentEvent[]>(`${base}/runs/${runId}/events?after=0`, {
      cache: "no-store",
    });
    setEvents(items);
  }, [base]);

  useEffect(() => {
    const pending = window.setTimeout(() => void loadOptions(), 0);
    return () => window.clearTimeout(pending);
  }, [loadOptions]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    const pending = window.setTimeout(() => {
      void apiRequest<AgentRun[]>(`${base}/runs?target_id=${encodeURIComponent(selectedId)}`, {
        cache: "no-store",
        signal: controller.signal,
      }).then((items) => {
        const latest = items[0];
        if (!latest) return;
        if (latest.artifact?.kind === "preparation_plan") {
          setEditedSummary((latest.artifact.content as PreparationContent).summary);
        } else if (latest.artifact?.kind === "drive_preparation") {
          setEditedAnnouncement((latest.artifact.content as DriveContent).announcement_draft);
        }
        setRun(latest);
        void loadEvents(latest.id);
      }).catch(() => undefined);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(pending);
    };
  }, [base, loadEvents, selectedId]);

  useEffect(() => {
    if (!run || !activeStatuses.has(run.status)) return;
    let stopped = false;
    let timer = 0;
    const poll = async () => {
      if (document.hidden) {
        timer = window.setTimeout(poll, 1_500);
        return;
      }
      try {
        const current = await apiRequest<AgentRun>(`${base}/runs/${run.id}`, {
          cache: "no-store",
        });
        if (stopped) return;
        if (current.artifact?.kind === "preparation_plan") {
          setEditedSummary((current.artifact.content as PreparationContent).summary);
        } else if (current.artifact?.kind === "drive_preparation") {
          setEditedAnnouncement((current.artifact.content as DriveContent).announcement_draft);
        }
        setRun(current);
        await loadEvents(run.id);
        if (activeStatuses.has(current.status)) timer = window.setTimeout(poll, 1_500);
      } catch (cause) {
        if (!stopped) setError(errorMessage(cause));
      }
    };
    timer = window.setTimeout(poll, 1_000);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [base, loadEvents, run]);

  const selectedDrive = useMemo(
    () => drives.find((drive) => drive.id === selectedId),
    [drives, selectedId],
  );

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || busy) return;
    setBusy(true);
    setError("");
    setEvents([]);
    try {
      const payload = audience === "student"
        ? {
            role_id: selectedId,
            goal,
            available_minutes_per_week: minutes,
            target_date: targetDate,
          }
        : {
            drive_id: selectedId,
            expected_revision: selectedDrive?.revision,
            recruiter_brief: brief,
            source_version_ids: sources
              .filter((source) =>
                source.review_status === "approved"
                && source.active
                && source.last_verified_at
                && !source.safe_error)
              .map((source) => source.id),
          };
      const created = await csrfRequest<AgentRun>(`${base}/runs`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      setRun(created);
      await loadEvents(created.id);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    if (!run?.required_action?.interrupt_id || !clarification.trim()) return;
    setBusy(true);
    setError("");
    try {
      const updated = await csrfRequest<AgentRun>(`${base}/runs/${run.id}/resume`, {
        method: "POST",
        body: JSON.stringify({
          expected_revision: run.revision,
          interrupt_id: run.required_action.interrupt_id,
          response: clarification,
        }),
      });
      setRun(updated);
      setClarification("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!run) return;
    setBusy(true);
    try {
      setRun(await csrfRequest<AgentRun>(`${base}/runs/${run.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ expected_revision: run.revision }),
      }));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    if (!run || audience !== "student") return;
    setBusy(true);
    setError("");
    try {
      await csrfRequest(`${base}/runs/${run.id}`, { method: "DELETE" });
      setRun(null);
      setEvents([]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveArtifact() {
    if (!run?.artifact) return;
    const artifact = run.artifact;
    const content = artifact.kind === "preparation_plan"
      ? { ...artifact.content, summary: editedSummary }
      : { ...artifact.content, announcement_draft: editedAnnouncement };
    setBusy(true);
    try {
      const updated = await csrfRequest<Artifact>(`${base}/artifacts/${artifact.id}`, {
        method: "PUT",
        body: JSON.stringify({ expected_revision: artifact.revision, content }),
      });
      setRun({ ...run, artifact: updated });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "accept" | "reject") {
    if (!run?.artifact) return;
    setBusy(true);
    try {
      const updated = await csrfRequest<Artifact>(
        `${base}/artifacts/${run.artifact.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({ expected_revision: run.artifact.revision, decision }),
        },
      );
      setRun({ ...run, status: "completed", artifact: updated });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function applyDriveArtifact() {
    if (!run?.artifact || !selectedDrive) return;
    setBusy(true);
    try {
      const updated = await csrfRequest<Artifact>(
        `${base}/artifacts/${run.artifact.id}/apply`,
        {
          method: "POST",
          body: JSON.stringify({
            expected_revision: run.artifact.revision,
            expected_drive_revision: selectedDrive.revision,
            fields: driveArtifact?.field_proposals.map((proposal) => proposal.field) ?? [],
          }),
        },
      );
      setRun({ ...run, artifact: updated });
      await loadOptions();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function toggleConsent() {
    if (!consent) return;
    try {
      setConsent(await csrfRequest<Consent>(`${base}/practice-consent`, {
        method: "PUT",
        body: JSON.stringify({ consent_version: "1", opted_in: !consent.opted_in }),
      }));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  const artifact = run?.artifact;
  const plan = artifact?.kind === "preparation_plan"
    ? artifact.content as PreparationContent
    : null;
  const driveArtifact = artifact?.kind === "drive_preparation"
    ? artifact.content as DriveContent
    : null;

  return (
    <section className={styles.workspace} aria-labelledby="agent-workflow-title">
      <header className={styles.header}>
        <div>
          <p>{audience === "student" ? "Opportunity preparation" : "Shared drive review"}</p>
          <h1 id="agent-workflow-title">
            {audience === "student" ? "Prepare me for this opportunity" : "Prepare this drive for review"}
          </h1>
          <span>
            {audience === "student"
              ? "Eligibility follows published rules. The agent builds a preparation plan from your profile and the role details, for you to review."
              : "Extract requirements, surface blockers, and review every proposed change with your team."}
          </span>
        </div>
        {run ? <Badge tone={run.status === "failed" ? "warning" : "neutral"}>{statusLabel(run.status)}</Badge> : null}
      </header>

      <Alert tone="info">
        <ShieldCheck aria-hidden="true" /> Each task is bounded to 4 model calls, 6 tools,
        one correction, 90 active seconds, and $0.03 reserved spend. Generated structure is
        checked against the available information before review. If your resume does not mention a skill,
        CampusHire marks it as not provided rather than assuming you lack it.
      </Alert>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!run ? (
        <form className={styles.launcher} onSubmit={start}>
          <div className={styles.formHeading}>
            <FileSearch aria-hidden="true" />
            <div><h2>Select the reviewed record</h2><p>No raw record IDs are required.</p></div>
          </div>
          <label>
            {audience === "student" ? "Published opportunity" : "Drive draft"}
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loading} required>
              <option value="">{loading ? "Loading…" : "Select a record"}</option>
              {(audience === "student" ? opportunities : drives).map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          {audience === "student" ? (
            <div className={styles.formGrid}>
              <label>Goal<textarea value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={500} required /></label>
              <label>Minutes available each week<input type="number" min={30} max={10080} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} required /></label>
              <label>Target date<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} required /></label>
            </div>
          ) : (
            <label>
              Authorized recruiter brief
              <textarea value={brief} onChange={(event) => setBrief(event.target.value)} minLength={20} maxLength={20000} rows={8} required placeholder="Paste the recruiter-provided brief for this review run." />
            </label>
          )}
          {!selectedId && !loading ? (
            <EmptyState title={audience === "student" ? "No open opportunity" : "No drive draft"}>
              <Link href={audience === "student" ? "/opportunities" : "/admin/drives"}>
                {audience === "student" ? "Explore opportunities" : "Create a drive"}
              </Link>
            </EmptyState>
          ) : null}
          <button type="submit" disabled={busy || loading || !selectedId}>
            {busy ? <LoaderCircle className={styles.spin} aria-hidden="true" /> : <BookOpenCheck aria-hidden="true" />}
            {busy ? "Queuing…" : "Start bounded preparation"}
          </button>
        </form>
      ) : (
        <div className={styles.runLayout}>
          <section className={styles.runPanel} aria-live="polite">
            <div className={styles.runHeading}>
              <div><p>Task status</p><h2>{statusLabel(run.status)}</h2></div>
              <div className={styles.actions}>
                {cancellableStatuses.has(run.status) ? <button type="button" className={styles.secondary} onClick={() => void cancel()} disabled={busy}><Ban aria-hidden="true" /> Cancel</button> : null}
                {audience === "student" && deletableStatuses.has(run.status) && run.artifact?.status !== "accepted" ? <button type="button" className={styles.secondary} onClick={() => void deleteTask()} disabled={busy}><Ban aria-hidden="true" /> Delete private task</button> : null}
                <button type="button" className={styles.secondary} onClick={() => { setRun(null); setEvents([]); setError(""); }}><RotateCcw aria-hidden="true" /> {cancellableStatuses.has(run.status) ? "Leave and resume later" : "New task"}</button>
              </div>
            </div>
            <dl className={styles.limits}>
              <div><dt>Model calls left</dt><dd>{run.limits.model_calls_remaining}</dd></div>
              <div><dt>Tools left</dt><dd>{run.limits.tool_calls_remaining}</dd></div>
              <div><dt>Active time left</dt><dd>{Math.floor(run.limits.active_seconds_remaining)}s</dd></div>
              <div><dt>Recorded spend</dt><dd>${(run.limits.actual_cost_microunits / 1_000_000).toFixed(4)}</dd></div>
            </dl>
            {activeStatuses.has(run.status) ? <Alert tone="info"><LoaderCircle className={styles.spin} aria-hidden="true" /> Work is persisted. You may leave and return.</Alert> : null}
            {run.status === "awaiting_input" ? (
              <div className={styles.interrupt}>
                <h3>{run.required_action?.question ?? "Clarification required"}</h3>
                <textarea value={clarification} onChange={(event) => setClarification(event.target.value)} maxLength={2000} rows={4} />
                <button type="button" onClick={() => void resume()} disabled={busy || !clarification.trim()}>Resume with answer</button>
              </div>
            ) : null}
            {run.status === "failed" ? <Alert tone="error"><CircleAlert aria-hidden="true" /> The task stopped safely: {run.safe_error ?? "validation failed"}. Existing records are unchanged.</Alert> : null}

            {plan ? <StudentArtifactView plan={plan} summary={editedSummary} onSummary={setEditedSummary} /> : null}
            {driveArtifact ? <DriveArtifactView content={driveArtifact} announcement={editedAnnouncement} onAnnouncement={setEditedAnnouncement} /> : null}
            {artifact?.status === "draft" && run.status === "awaiting_review" ? (
              <div className={styles.reviewActions}>
                <button type="button" className={styles.secondary} onClick={() => void decide("reject")} disabled={busy}>Reject</button>
                <button type="button" className={styles.secondary} onClick={() => void saveArtifact()} disabled={busy}>Save edits</button>
                <button type="button" onClick={() => void decide("accept")} disabled={busy}><Check aria-hidden="true" /> Accept proposal</button>
              </div>
            ) : null}
            {artifact?.status === "accepted" && audience === "tnp" ? (
              <div className={styles.reviewActions}>
                <Alert tone="success"><BadgeCheck aria-hidden="true" /> Accepted for this shared drive workspace. Applying remains a separate authorized action.</Alert>
                <button type="button" onClick={() => void applyDriveArtifact()} disabled={busy || !driveArtifact?.field_proposals.length}>Apply reviewed fields</button>
              </div>
            ) : null}
            {artifact?.status === "accepted" && audience === "student" ? (
              <Alert tone="success">Plan accepted and preserved. <Link href={`/resume/studio?role=${artifact.target_id}`}>Tailor my resume</Link></Alert>
            ) : null}
          </section>

          <aside className={styles.activity}>
            <h2>Activity</h2>
            <ol>{events.map((event) => <li key={event.sequence}><span><Clock3 aria-hidden="true" /></span><div><strong>{event.summary}</strong><small>{new Date(event.created_at).toLocaleString()}</small></div></li>)}</ol>
            {artifact ? (
              <details>
                <summary>Sources and versions</summary>
                <ul>
                  {artifact.evidence_references.map((reference) => (
                    <li key={reference.source_id}>
                      {reference.label}
                      <small>v{reference.version} · {reference.access_scope}</small>
                    </li>
                  ))}
                  <li>
                    Model release
                    <small>{artifact.provider_name} · <span>{artifact.model_version}</span></small>
                  </li>
                  <li>
                    Workflow release
                    <small><span>{artifact.workflow_version}</span></small>
                  </li>
                  <li>
                    Source projection
                    <small><span>{artifact.source_projection_version}</span></small>
                  </li>
                  {artifact.evaluation_run_id ? (
                    <li>
                      Evaluation run
                      <small><span>{artifact.evaluation_run_id}</span></small>
                    </li>
                  ) : null}
                </ul>
              </details>
            ) : null}
          </aside>
        </div>
      )}

      {audience === "student" && consent ? (
        <section className={styles.consent}>
          <div><strong>Private practice analytics</strong><p>Practice conversations, free-text answers, and memory remain private. Qualified derived assessment results can enter weekly groups of at least 10 students only with your consent.</p></div>
          <button type="button" className={styles.secondary} aria-pressed={consent.opted_in} onClick={() => void toggleConsent()}>{consent.opted_in ? "Withdraw consent" : "Opt in"}</button>
        </section>
      ) : null}
      {audience === "tnp" ? <SourceRegistry base={base} sources={sources} onChange={setSources} /> : null}
    </section>
  );
}

function StudentArtifactView({ plan, summary, onSummary }: { plan: PreparationContent; summary: string; onSummary: (value: string) => void }) {
  return <section className={styles.artifact}><div className={styles.artifactHeader}><div><p>Preparation proposal</p><h2>{plan.title}</h2></div><Badge tone={plan.eligibility.status === "eligible" ? "success" : "warning"}>{plan.eligibility.status.replaceAll("_", " ")}</Badge></div><label>Plan summary<textarea value={summary} onChange={(event) => onSummary(event.target.value)} rows={4} /></label><div className={styles.truthGrid}><article><strong>Eligibility</strong><p>Deterministic rule result · version {plan.eligibility.rule_version ?? "unavailable"}</p></article><article><strong>Details not listed in the profile</strong><p>{plan.eligibility.missing_evidence.join(", ") || "No missing details are listed for this role"}</p></article><article><strong>Planned effort</strong><p>{plan.total_minutes} minutes</p></article></div><div className={styles.priorities}>{plan.priorities.map((priority) => <article key={priority.skill}><div><h3>{priority.skill}</h3><Badge tone={priority.evidence_state === "recorded" ? "success" : "neutral"}>{priority.evidence_state}</Badge></div><p>{priority.rationale}</p><ul>{priority.activities.map((activity) => <li key={`${priority.skill}-${activity.title}`}><strong>{activity.title}</strong><span>{activity.objective}</span><small>{activity.minutes} min · due in {activity.due_offset_days} days</small></li>)}</ul></article>)}</div>{plan.unresolved_questions.length ? <Alert tone="warning">Unresolved: {plan.unresolved_questions.join(" · ")}</Alert> : null}</section>;
}

function DriveArtifactView({ content, announcement, onAnnouncement }: { content: DriveContent; announcement: string; onAnnouncement: (value: string) => void }) {
  const [tab, setTab] = useState<"requirements" | "blockers" | "proposals">("requirements");
  return <section className={styles.artifact}><div className={styles.tabs} role="tablist" aria-label="Drive review views"><button type="button" role="tab" aria-selected={tab === "requirements"} onClick={() => setTab("requirements")}>Requirements</button><button type="button" role="tab" aria-selected={tab === "blockers"} onClick={() => setTab("blockers")}>Blockers</button><button type="button" role="tab" aria-selected={tab === "proposals"} onClick={() => setTab("proposals")}>Proposals</button></div>{tab === "requirements" ? <div className={styles.proposals}>{content.field_proposals.map((proposal) => <article key={proposal.field}><strong>{proposal.field.replaceAll("_", " ")}</strong><p>{proposal.proposed_value}</p><small>{proposal.rationale}</small></article>)}{!content.field_proposals.length ? <p>No source-supported field change was proposed.</p> : null}</div> : null}{tab === "blockers" ? <div className={styles.blockers}>{content.blockers.map((blocker) => <article key={blocker.key}><div><strong>{blocker.description}</strong><Badge tone={blocker.status === "resolved" ? "success" : "warning"}>{blocker.status}</Badge></div><dl><div><dt>Owner</dt><dd>{blocker.owner_role}</dd></div><div><dt>Next action</dt><dd>{blocker.next_action}</dd></div><div><dt>Deadline</dt><dd>{blocker.deadline ?? "Not set"}</dd></div></dl></article>)}{!content.blockers.length ? <p>No blockers proposed.</p> : null}</div> : null}{tab === "proposals" ? <div className={styles.proposals}><label>Announcement draft<textarea value={announcement} onChange={(event) => onAnnouncement(event.target.value)} rows={10} /></label>{content.clarification_questions.length ? <article><strong>Clarification questions</strong><ul>{content.clarification_questions.map((question) => <li key={question}>{question}</li>)}</ul></article> : null}</div> : null}</section>;
}

function SourceRegistry({ base, sources, onChange }: { base: string; sources: SourceVersion[]; onChange: (items: SourceVersion[]) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const item = await csrfRequest<SourceVersion>(`${base}/sources`, { method: "POST", body: JSON.stringify({ source_type: form.get("source_type"), canonical_url: form.get("url"), title: form.get("title"), permitted_use: "learning-resource metadata and reviewed role preparation" }) });
      onChange([item, ...sources]);
      event.currentTarget.reset();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function review(source: SourceVersion, decision: "approve" | "reject") {
    setBusy(true);
    setError("");
    try {
      const updated = await csrfRequest<SourceVersion>(`${base}/sources/${source.id}/review`, {
        method: "POST",
        body: JSON.stringify({ expected_version: source.version, decision }),
      });
      onChange(sources.map((item) => item.id === source.id ? updated : item));
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return <details className={styles.sources}><summary>Approved source registry</summary><p>Register permitted metadata URLs. Changed metadata creates a pending version; it never overwrites campus rules.</p>{error ? <Alert tone="error">{error}</Alert> : null}<form onSubmit={add}><label>Source type<select name="source_type"><option value="nptel">NPTEL</option><option value="swayam">SWAYAM</option><option value="official_career_page">Official career page</option><option value="faculty_resource">Faculty resource</option></select></label><label>Title<input name="title" minLength={2} maxLength={300} required /></label><label>HTTPS URL<input name="url" type="url" pattern="https://.*" required /></label><button type="submit" disabled={busy}>Register pending source</button></form><ul>{sources.map((source) => <li key={source.id}><a href={source.canonical_url} target="_blank" rel="noreferrer">{source.title}</a><span>v{source.version} · {source.review_status}{source.safe_error ? ` · ${source.safe_error}` : ""}</span>{source.review_status === "pending" ? <span className={styles.sourceActions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => void review(source, "reject")}>Reject</button><button type="button" disabled={busy} onClick={() => void review(source, "approve")}>Approve</button></span> : null}</li>)}</ul></details>;
}
