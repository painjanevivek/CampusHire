"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Cloud, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type { InstitutionOnboardingResponse } from "@/lib/api/generated/types.gen";
import styles from "./onboarding-wizard.module.css";

const steps = ["Administrator & MFA", "Institution identity", "Academic structure", "Placement cycle", "Roster & invitations", "Policies & permissions", "Review & activate"];
type State = InstitutionOnboardingResponse;
type Draft = Record<string, string>;
const blank: Draft = { administrator_name: "", official_name: "", domain: "", campus_name: "", program_name: "", branches: "", batches: "", cycle_name: "", starts_on: "", ends_on: "", cohorts: "", roster_import_id: "", invitation_mode: "roster_and_verified_domain", policy_names: "", eligibility_templates: "", approval_roles: "tnp_owner,tnp_admin", invite_team_emails: "" };
const list = (value: string) => value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);

function bodyFor(step: number, draft: Draft) {
  if (step === 1) return { administrator: { administrator_name: draft.administrator_name } };
  if (step === 2) return { institution: { official_name: draft.official_name, domain: draft.domain } };
  if (step === 3) return { campuses: [{ name: draft.campus_name, programs: [{ name: draft.program_name, branches: list(draft.branches), graduating_batches: list(draft.batches).map(Number) }] }] };
  if (step === 4) return { placement_cycle: { name: draft.cycle_name, starts_on: draft.starts_on, ends_on: draft.ends_on, participating_cohorts: list(draft.cohorts) } };
  if (step === 5) return { roster: { roster_import_id: draft.roster_import_id || null, invitation_mode: draft.invitation_mode } };
  if (step === 6) return { policies: { eligibility_template_names: list(draft.eligibility_templates), policy_names: list(draft.policy_names), approval_roles: list(draft.approval_roles) } };
  return { review: { invite_team_emails: list(draft.invite_team_emails), activate_institution: true } };
}

function canSaveStep(step: number, draft: Draft) {
  if (step === 1) return draft.administrator_name.trim().length >= 2;
  if (step === 2) return draft.official_name.trim().length >= 2 && draft.domain.trim().length >= 3;
  if (step === 3) return draft.campus_name.trim().length >= 2 && draft.program_name.trim().length >= 2 && list(draft.branches).length > 0 && list(draft.batches).every((item) => Number(item) >= 1990);
  if (step === 4) return draft.cycle_name.trim().length >= 2 && Boolean(draft.starts_on) && Boolean(draft.ends_on) && list(draft.cohorts).length > 0;
  return step === 5 || step === 6;
}

export function hydrateInstitutionOnboardingDraft(state: State): Draft {
  const stepValue = (step: string) => {
    const value = state.step_data[step];
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  };
  const objectValue = (step: string, key: string) => {
    const value = stepValue(step)[key];
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  };
  const stringValue = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
  const joinedValue = (value: unknown) => Array.isArray(value) ? value.map(String).join(", ") : "";

  const administrator = objectValue("1", "administrator");
  const institution = objectValue("2", "institution");
  const campuses = stepValue("3").campuses;
  const campus = Array.isArray(campuses) && campuses[0] && typeof campuses[0] === "object"
    ? campuses[0] as Record<string, unknown>
    : {};
  const programs = campus.programs;
  const program = Array.isArray(programs) && programs[0] && typeof programs[0] === "object"
    ? programs[0] as Record<string, unknown>
    : {};
  const placementCycle = objectValue("4", "placement_cycle");
  const roster = objectValue("5", "roster");
  const policies = objectValue("6", "policies");
  const review = objectValue("7", "review");

  return {
    ...blank,
    administrator_name: stringValue(administrator.administrator_name),
    official_name: stringValue(institution.official_name, state.institution_name),
    domain: stringValue(institution.domain),
    campus_name: stringValue(campus.name),
    program_name: stringValue(program.name),
    branches: joinedValue(program.branches),
    batches: joinedValue(program.graduating_batches),
    cycle_name: stringValue(placementCycle.name),
    starts_on: stringValue(placementCycle.starts_on),
    ends_on: stringValue(placementCycle.ends_on),
    cohorts: joinedValue(placementCycle.participating_cohorts),
    roster_import_id: stringValue(roster.roster_import_id),
    invitation_mode: stringValue(roster.invitation_mode, blank.invitation_mode),
    policy_names: joinedValue(policies.policy_names),
    eligibility_templates: joinedValue(policies.eligibility_template_names),
    approval_roles: joinedValue(policies.approval_roles) || blank.approval_roles,
    invite_team_emails: joinedValue(review.invite_team_emails),
  };
}

export function InstitutionOnboardingWizard() {
  const [data, setData] = useState<State | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error" | "conflict">("loading");
  const [message, setMessage] = useState("");
  const saving = useRef(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const loaded = await apiRequest<State>("/tnp/onboarding", { cache: "no-store" });
      const stored = window.sessionStorage.getItem(`campushire.admin-onboarding.${loaded.institution_id}`);
      const recovered = stored ? JSON.parse(stored) as { revision: number; step: number; draft: Draft } : null;
      const serverDraft = hydrateInstitutionOnboardingDraft(loaded);
      setData(loaded); setDraft(recovered?.revision === loaded.revision ? { ...serverDraft, ...recovered.draft } : serverDraft); setStep(recovered?.revision === loaded.revision ? recovered.step : Math.min(loaded.current_step, 7)); setDirty(Boolean(recovered?.revision === loaded.revision)); setStatus("idle");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Could not load institution onboarding."); setStatus("error"); }
  }, []);
  useEffect(() => { const timeout = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeout); }, [load]);
  useEffect(() => {
    if (!data || !dirty) return;
    window.sessionStorage.setItem(`campushire.admin-onboarding.${data.institution_id}`, JSON.stringify({ revision: data.revision, step, draft }));
    if (!canSaveStep(step, draft)) return;
    const timeout = window.setTimeout(() => void save(false), 900);
    return () => window.clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.institution_id, data?.revision, dirty, draft, step]);

  function change(key: string, value: string) { setDraft((current) => ({ ...current, [key]: value })); setDirty(true); setStatus("idle"); }
  async function save(advance: boolean) {
    if (!data || saving.current) return;
    if (!dirty && (!advance || data.completed_steps.includes(step) || data.institution_active)) {
      if (advance && step < 7) setStep(step + 1);
      return;
    }
    if (step < 7 && !canSaveStep(step, draft)) {
      setStatus("error"); setMessage("Complete the required fields for this step. Your tab draft remains saved."); return;
    }
    saving.current = true; setStatus("saving"); setMessage("");
    try {
      const saved = await csrfRequest<State>("/tnp/onboarding/step", { method: "PUT", body: JSON.stringify({ expected_revision: data.revision, step, ...bodyFor(step, draft) }) });
      setData(saved); setDirty(false); setStatus("saved"); window.sessionStorage.removeItem(`campushire.admin-onboarding.${saved.institution_id}`); if (advance && step < 7) setStep(step + 1); else if (step === 7) setMessage("Institution activated. Policies and placement cycles remain drafts until separately published.");
    } catch (cause) { setStatus(cause instanceof ApiError && cause.status === 409 ? "conflict" : "error"); setMessage(cause instanceof ApiError ? cause.message : "The step could not be saved."); }
    finally { saving.current = false; }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(true); }
  if (!data) return <main className={styles.page}><div className={styles.loadingState}><LoaderCircle aria-hidden="true" />{message || "Loading institution onboarding…"}</div></main>;

  return <main id="main-content" className={styles.page}><header className={styles.hero}><div><p>Verified institution setup</p><h1>Configure before activation.</h1><span>All administrator changes are audited. Nothing publishes automatically.</span></div><div className={styles.stepCount}><strong>{step}</strong><span>of 7 steps</span></div></header><div className={styles.layout}><aside className={styles.stepRail}><p>Institution setup</p><ol tabIndex={0} aria-label="Institution onboarding steps">{steps.map((title, index) => <li key={title} data-state={index + 1 === step ? "current" : data.completed_steps.includes(index + 1) ? "complete" : "upcoming"}><span>{index + 1}</span>{data.completed_steps.includes(index + 1) ? <Check aria-hidden="true" /> : <span />}{title}</li>)}</ol>{data.institution_active ? <Link href="/admin/dashboard">Open workspace</Link> : <span>Inactive until step 7</span>}</aside><section className={styles.panel}><header className={styles.panelHeader}><div><p>Step {step}</p><h2>{steps[step - 1]}</h2><span>Save and return later. Activation is explicit and verification-gated.</span></div><div className={styles.saveStatus} data-state={status}><Cloud aria-hidden="true" />{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Audited"}</div></header>{message ? <Alert tone={status === "error" || status === "conflict" ? "error" : "success"}>{message}{status === "conflict" ? <Button type="button" variant="quiet" onClick={() => void load()}>Reload</Button> : null}</Alert> : null}<form className={styles.form} onSubmit={submit}>
    {step === 1 ? <><Input id="administrator_name" label="Administrator full name" value={draft.administrator_name} onChange={(e) => change("administrator_name", e.target.value)} required /><Alert tone="info">MFA is required before this onboarding route is available.</Alert></> : null}
    {step === 2 ? <><Input id="official_name" label="Verified institution name" value={draft.official_name} onChange={(e) => change("official_name", e.target.value)} required /><Input id="domain" label="Verified domain" value={draft.domain} onChange={(e) => change("domain", e.target.value)} required /></> : null}
    {step === 3 ? <><Input id="campus_name" label="Campus" value={draft.campus_name} onChange={(e) => change("campus_name", e.target.value)} required /><Input id="program_name" label="Program" value={draft.program_name} onChange={(e) => change("program_name", e.target.value)} required /><Input id="branches" label="Branches" hint="Comma-separated" value={draft.branches} onChange={(e) => change("branches", e.target.value)} required /><Input id="batches" label="Graduating batches" hint="Comma-separated years" value={draft.batches} onChange={(e) => change("batches", e.target.value)} required /></> : null}
    {step === 4 ? <><Input id="cycle_name" label="Placement cycle name" value={draft.cycle_name} onChange={(e) => change("cycle_name", e.target.value)} required /><Input id="starts_on" label="Start date" type="date" value={draft.starts_on} onChange={(e) => change("starts_on", e.target.value)} required /><Input id="ends_on" label="End date" type="date" value={draft.ends_on} onChange={(e) => change("ends_on", e.target.value)} required /><Input id="cohorts" label="Participating cohorts" hint="Comma-separated" value={draft.cohorts} onChange={(e) => change("cohorts", e.target.value)} required /><Alert tone="info">This creates configuration only. The cycle is not published.</Alert></> : null}
    {step === 5 ? <><Input id="roster_import_id" label="Validated roster import ID (optional)" value={draft.roster_import_id} onChange={(e) => change("roster_import_id", e.target.value)} hint="Use the roster preview workflow before entering an ID." /><Link href="/admin/students">Open roster preview and validation</Link><Select id="invitation_mode" label="Student invitation mode" value={draft.invitation_mode} onChange={(e) => change("invitation_mode", e.target.value)}><option value="roster_only">Roster only</option><option value="roster_and_verified_domain">Roster and verified domain</option></Select><Alert tone="info">Roster imports retain preview, validation, and duplicate detection. No invitation is sent by saving this step.</Alert></> : null}
    {step === 6 ? <><Input id="eligibility_templates" label="Eligibility template names (drafts)" value={draft.eligibility_templates} onChange={(e) => change("eligibility_templates", e.target.value)} /><Input id="policy_names" label="Policy names (drafts)" value={draft.policy_names} onChange={(e) => change("policy_names", e.target.value)} /><Input id="approval_roles" label="Proposal approval roles" value={draft.approval_roles} onChange={(e) => change("approval_roles", e.target.value)} /><Alert tone="warning">Policies, rules, and cycles remain drafts. Publishing always uses a separate authorized action.</Alert></> : null}
    {step === 7 ? <div className={styles.reviewList}><div><Check aria-hidden="true" /><span><strong>Institution verified</strong><small>Identity and domain must match operator-approved records.</small></span></div><div><Check aria-hidden="true" /><span><strong>No automatic publishing</strong><small>Activation does not publish policies, cycles, rules, or messages.</small></span></div><Input id="invite_team_emails" label="Team administrator emails (optional)" hint="Invitations are sent only when you explicitly activate." value={draft.invite_team_emails} onChange={(e) => change("invite_team_emails", e.target.value)} /></div> : null}
    <div className={styles.actions}>{step > 1 ? <Button type="button" variant="quiet" onClick={() => setStep(step - 1)}><ArrowLeft aria-hidden="true" /> Back</Button> : null}<Button type="submit" disabled={status === "saving"}>{step === 7 ? "Activate verified institution" : <>Save and continue <ArrowRight aria-hidden="true" /></>}</Button></div>
  </form></section></div></main>;
}
