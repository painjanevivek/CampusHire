"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Alert } from "@/components/ui/feedback";
import type { OpportunityPage, ResumeChoice } from "@/features/recruitment/types";
import { useResource } from "./use-resource";
import styles from "./experience.module.css";

type PreparationData = { role_title: string; source_resume_version_id: string | null; source_profile_revision: number | null; guidance_stale: boolean;
  activities?: Array<{ requirement: string; title: string; completion: string; template: string; template_version: string }>;
  evidence: Array<{ requirement: string; demonstrated: boolean; evidence: string }>; requirements: string[]; mapping_status: string;
  suggestions: Array<{ id: string; original: string; proposed: string; reason: string; status: string }> };

function RolePreparation({ roleId }: { roleId: string }) {
  const [resumeId, setResumeId] = useState("");
  const versions = useResource<ResumeChoice[]>("/resumes");
  const { data, error, loading, refresh } = useResource<PreparationData>(`/opportunities/${encodeURIComponent(roleId)}/preparation${resumeId ? `?resume_id=${encodeURIComponent(resumeId)}` : ""}`);
  return <section className={styles.stack} aria-label="Opportunity preparation" aria-busy={loading}>
    <label className={styles.toolbar}>Reviewed resume<select value={resumeId} onChange={event => setResumeId(event.target.value)}><option value="">Latest reviewed version</option>{versions.data?.filter(item => item.status === "completed" && item.scan_status === "clean").map(item => <option key={item.id} value={item.id}>{item.original_name} · v{item.version_number}</option>)}</select></label>
    {loading && <p role="status">Checking recorded evidence…</p>}
    {error && <Alert tone="error">{error} <button className={styles.button} onClick={refresh}>Retry</button></Alert>}
    {data && <>
      <section className={styles.panel} data-primary="true"><h2>Prepare for {data.role_title}</h2><p>This is preparation guidance, not an eligibility decision. No AI generation runs when you open this page.</p>
        <p>Profile revision {data.source_profile_revision ?? "not available"} · {data.source_resume_version_id ? "Reviewed resume selected" : "No reviewed resume available"}</p>
        {data.guidance_stale && <Alert tone="warning">Your profile changed after this resume version. Review the source details before using earlier suggestions.</Alert>}
        <details><summary>Source version evidence</summary><p className={styles.muted}>Resume: {data.source_resume_version_id ?? "Not available"}</p></details>
      </section>
      <section className={styles.panel}><h2>Requirements and your evidence</h2><ul>{data.evidence.map(item => <li key={item.requirement}><h3>{item.requirement}</h3><p>{item.evidence}</p></li>)}</ul>
        {!data.evidence.length && <p>No structured skill requirements were supplied.</p>}
        <h3>Other published requirements</h3>{data.requirements.length ? <ul>{data.requirements.map(item => <li key={item}>{item}</li>)}</ul> : <p>Not provided.</p>}
        <p>Text matching cannot verify proficiency or infer missing experience.</p></section>
      <section className={styles.panel}><h2>Existing resume suggestions</h2>{data.suggestions.length ? data.suggestions.map(item => <article key={item.id}><h3>{item.status.replaceAll("_", " ")}</h3><p>Original: {item.original}</p><p>Proposed: {item.proposed}</p><p>Reason: {item.reason}</p></article>) : <p>No suggestions have been recorded for this resume.</p>}
        <Link className={styles.button} href="/resume">Review and explicitly accept changes in Resume</Link></section>
      <section className={styles.panel}><h2>Approved preparation activities</h2><p>{data.mapping_status}</p>{data.activities?.map((item, index) => <article key={index}><h3>{item.requirement}: {item.title}</h3><p>{item.completion}</p><p>{item.template} · version {item.template_version}</p></article>)}<Link className={styles.button} href="/roadmap">Browse approved roadmaps</Link></section>
      <Link href={`/opportunities/${encodeURIComponent(roleId)}`}>Return to opportunity</Link>
    </>}
  </section>;
}

export function Preparation() {
  const roleId = useSearchParams().get("role");
  const roles = useResource<OpportunityPage>(roleId ? null : "/opportunities?saved_only=true");
  return <PageContainer context="student" className={styles.stack}>
    <PageHeader eyebrow="Preparation" title="Turn your evidence into a clear next step." description="Review your resume, follow approved activities, or prepare for a particular opportunity." />
    {roleId ? <RolePreparation key={roleId} roleId={roleId} /> : <>
      <div className={styles.grid}><section className={styles.panel}><h2>Resume</h2><p>Review extracted facts and accept only the changes you want.</p><Link className={styles.button} href="/resume">Open resume workspace</Link></section><section className={styles.panel}><h2>Roadmap</h2><p>Work through approved activities with explicit completion evidence.</p><Link className={styles.button} href="/roadmap">Open roadmap</Link></section></div>
      <section className={styles.panel}><h2>Prepare for a saved opportunity</h2>{roles.error && <Alert tone="error">{roles.error} <button onClick={roles.refresh}>Retry</button></Alert>}{roles.loading && <p role="status">Loading saved roles…</p>}
        {roles.data?.items.map(role => <p key={role.id}><Link href={`/preparation?role=${role.id}`}>{role.title} · {role.company_name}</Link></p>)}
        {!roles.loading && !roles.data?.items.length && <p>Save a role to bring its preparation context here.</p>}<Link href="/opportunities">Explore opportunities</Link></section>
    </>}
  </PageContainer>;
}
