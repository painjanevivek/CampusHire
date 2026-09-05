"use client";

import type { Drive } from "@/features/recruitment/types";
import { Alert } from "@/components/ui/feedback";
import { useResource } from "./use-resource";
import styles from "./experience.module.css";

type Preview = { title: string; company_name: string; opens_at: string; deadline_at: string; blockers: string[]; completed_steps?: number[]; pending_changes: Record<string, unknown>;
  roles: Array<{ id: string; visible_on_publish?: boolean; title: string; description: string; location: string; work_mode: string; salary_display: string | null; requirements: string[]; rules: Array<{ label?: string }>; form_questions: Array<{ prompt?: string }>; pending_changes: Record<string, unknown> }> };
const steps = ["Company and drive", "Roles", "Eligibility", "Dates and documents", "Preview and publish"];

export function GuidedPublishing({ drive, step, onStep, onEdit, onPublish, busy }: {
  drive: Drive; step: number; onStep: (step: number) => void; onEdit: (panel: "edit-drive" | "role" | "rules") => void;
  onPublish: () => void; busy: boolean;
}) {
  const resource = useResource<Preview>(`/admin/recruitment/drives/${drive.id}/publication-preview`);
  const preview = resource.data;
  return <section className={styles.panel} data-primary="true" aria-label="Guided drive publishing">
    <nav className={styles.tabs} aria-label="Publishing steps">{steps.map((label, index) => <button key={label} onClick={() => onStep(index + 1)} aria-current={step === index + 1 ? "page" : undefined}>{index + 1}. {label} · {preview?.completed_steps?.includes(index + 1) ? "Ready" : "Review"}</button>)}</nav>
    <p>Saved progress belongs to this server draft. Save an open editor before changing steps; published application snapshots remain unchanged.</p>
    <h3>Step {step}: {steps[step - 1]}</h3>
    {resource.error && <Alert tone="error">The publication checklist could not be verified. <button onClick={resource.refresh}>Refresh checklist</button></Alert>}
    {resource.loading && <p role="status">Checking saved publication requirements…</p>}
    {step === 1 && <><p>{drive.company_name} · {drive.title}. Company and drive details are saved.</p><button className={styles.button} onClick={() => onEdit("edit-drive")}>Edit company and drive</button></>}
    {step === 2 && <><p>{drive.role_count} saved roles. Add a role or edit an existing role below.</p><button className={styles.button} onClick={() => onEdit("role")}>Add role details</button></>}
    {step === 3 && <><p>Select a role below to review its rules and approved policy references. Publish draft rule versions and roles before the first drive publication.</p><button className={styles.button} disabled={!drive.role_count} onClick={() => onEdit("rules")}>Review selected role rules</button></>}
    {step === 4 && <><p>Opens {new Date(preview?.opens_at ?? drive.opens_at).toLocaleString()} · closes {new Date(preview?.deadline_at ?? drive.deadline_at).toLocaleString()} (your local time).</p><p>A clean reviewed resume is required for application. Additional published form questions appear in the final preview.</p><button className={styles.button} onClick={() => onEdit("edit-drive")}>Edit dates</button></>}
    {preview && <p role="status">{preview.blockers.length ? `${preview.blockers.length} publication checks need attention.` : "Saved publication checks are ready. The server revalidates when you confirm."}</p>}
    {step === 5 && preview && <div className={styles.stack}>
      {!!preview.blockers.length && <Alert tone="warning"><ul>{preview.blockers.map(item => <li key={item}>{item}</li>)}</ul></Alert>}
      <h3>{preview.company_name} · {preview.title}</h3><p>Student application window: {new Date(preview.opens_at).toLocaleString()} – {new Date(preview.deadline_at).toLocaleString()}</p>
      {preview.roles.map(role => <article key={role.id} className={styles.panel}><h3>{role.title}</h3>{role.visible_on_publish === false && <p role="note">Draft role: not visible to students in this publication.</p>}<p>{role.description}</p><p>{role.location} · {role.work_mode} · {role.salary_display ?? "Compensation not provided"}</p><h4>Required documents and details</h4><p>Clean, reviewed resume</p><ul>{role.requirements.map(item => <li key={item}>{item}</li>)}{role.form_questions.map((item, index) => <li key={index}>{item.prompt}</li>)}</ul><h4>Eligibility rules</h4><ul>{role.rules.map((rule, index) => <li key={index}>{rule.label ?? "Published requirement"}</li>)}</ul>
        {!!Object.keys(role.pending_changes).length && <details><summary>Role changes being applied</summary><pre className={styles.tableWrap}>{JSON.stringify(role.pending_changes, null, 2)}</pre></details>}</article>)}
      {!!Object.keys(preview.pending_changes).length && <details><summary>Drive changes being applied</summary><pre className={styles.tableWrap}>{JSON.stringify(preview.pending_changes, null, 2)}</pre></details>}
      <button className={styles.primary} disabled={busy || resource.loading || !!resource.error || !!preview.blockers.length || (drive.status === "published" && !drive.has_pending_changes)} onClick={onPublish}>{drive.status === "published" ? "Confirm and apply staged changes" : "Confirm and publish drive"}</button>
    </div>}
    <div className={styles.toolbar}><button className={styles.button} disabled={step === 1} onClick={() => onStep(step - 1)}>Previous step</button><button className={styles.button} disabled={step === 5} onClick={() => onStep(step + 1)}>Next step</button></div>
  </section>;
}
