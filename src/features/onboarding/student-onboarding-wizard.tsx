"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Cloud, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { PageContainer } from "@/components/layout/page-layout";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type { StudentOnboardingResponse } from "@/lib/api/generated/types.gen";
import styles from "./onboarding-wizard.module.css";

const steps = [
  ["Your profile", "Identity and education"],
  ["Experience", "Internships and employment"],
  ["Projects & skills", "Work, outcomes, and credentials"],
  ["Career preferences", "Roles and work preferences"],
  ["Placement details", "Participation, privacy, and review"],
] as const;

type Onboarding = StudentOnboardingResponse;
type Draft = Record<string, string | boolean>;
type SaveState = "loading" | "idle" | "saving" | "saved" | "error" | "conflict";

const blank: Draft = {
  full_name: "", prn: "", department: "", graduation_year: "",
  degree: "", branch: "", education_institution: "", start_year: "", score: "", score_scale: "cgpa_10", active_backlogs: "0",
  experience_organization: "", experience_title: "", experience_start: "", experience_end: "", responsibilities: "",
  project_title: "", project_description: "", technologies: "", outcomes: "", skills: "", certification_name: "", certification_issuer: "",
  target_roles: "", industries: "", locations: "", job_types: "full_time", work_modes: "hybrid",
  placement_cycle: "", communication_email: true, communication_in_app: true, visibility: "placement_team", privacy_accepted: false,
  review_confirmed: false,
};

const lines = (value: string | boolean) => String(value).split(/[\n,]/).map((item) => item.trim()).filter(Boolean);

export function onboardingStageForBackendStep(backendStep: number): number {
  if (backendStep <= 2) return 1;
  return Math.min(backendStep - 1, 5);
}

function hydrate(data: Onboarding): Draft {
  const education = data.education[0] ?? {};
  const experience = data.experience[0] ?? {};
  const project = data.projects[0] ?? {};
  const certification = data.certifications[0] ?? {};
  const career = data.career_preferences ?? {};
  const participation = data.placement_participation ?? {};
  const channels = Array.isArray(participation.communication_channels) ? participation.communication_channels : [];
  return {
    ...blank,
    full_name: String(data.identity.full_name ?? ""), prn: String(data.identity.prn ?? ""), department: String(data.identity.department ?? ""), graduation_year: String(data.identity.graduation_year ?? ""),
    degree: String(education.degree ?? ""), branch: String(education.branch ?? ""), education_institution: String(education.institution ?? data.institution_name ?? ""), start_year: String(education.start_year ?? ""), score: String(education.score ?? ""), score_scale: String(education.score_scale ?? "cgpa_10"), active_backlogs: String(education.active_backlogs ?? 0),
    experience_organization: String(experience.organization ?? ""), experience_title: String(experience.title ?? ""), experience_start: String(experience.start_date ?? ""), experience_end: String(experience.end_date ?? ""), responsibilities: Array.isArray(experience.responsibilities) ? experience.responsibilities.join("\n") : "",
    project_title: String(project.title ?? ""), project_description: String(project.description ?? ""), technologies: Array.isArray(project.technologies) ? project.technologies.join(", ") : "", outcomes: Array.isArray(project.outcomes) ? project.outcomes.join("\n") : "", skills: data.skills.map((item) => String(item.name ?? "")).filter(Boolean).join(", "), certification_name: String(certification.name ?? ""), certification_issuer: String(certification.issuer ?? ""),
    target_roles: Array.isArray(career.target_roles) ? career.target_roles.join(", ") : "", industries: Array.isArray(career.industries) ? career.industries.join(", ") : "", locations: Array.isArray(career.locations) ? career.locations.join(", ") : "", job_types: Array.isArray(career.job_types) ? career.job_types.join(",") : "full_time", work_modes: Array.isArray(career.work_modes) ? career.work_modes.join(",") : "hybrid",
    placement_cycle: String(participation.placement_cycle ?? ""), communication_email: channels.includes("email"), communication_in_app: channels.includes("in_app"), visibility: String(participation.visibility ?? "placement_team"), privacy_accepted: Boolean(participation.privacy_accepted), review_confirmed: data.completed,
  };
}

function backendStepBody(step: number, draft: Draft) {
  const value = (key: string) => String(draft[key] ?? "").trim();
  if (step === 1) return { identity: { full_name: value("full_name"), prn: value("prn"), department: value("department"), graduation_year: Number(value("graduation_year")) } };
  if (step === 2) return { education: [{ qualification_level: "degree", degree: value("degree"), branch: value("branch"), institution: value("education_institution"), start_year: value("start_year") ? Number(value("start_year")) : null, graduation_year: Number(value("graduation_year")), score: Number(value("score")), score_scale: value("score_scale"), active_backlogs: Number(value("active_backlogs") || 0) }] };
  if (step === 3) return { experience: value("experience_organization") ? [{ organization: value("experience_organization"), title: value("experience_title"), start_date: value("experience_start"), end_date: value("experience_end") || null, is_current: !value("experience_end"), responsibilities: lines(draft.responsibilities) }] : [] };
  if (step === 4) return { projects_skills: { projects: value("project_title") ? [{ title: value("project_title"), description: value("project_description"), technologies: lines(draft.technologies), outcomes: lines(draft.outcomes), project_url: null }] : [], skills: lines(draft.skills), certifications: value("certification_name") ? [{ name: value("certification_name"), issuer: value("certification_issuer"), issued_on: null, expires_on: null, credential_url: null }] : [] } };
  if (step === 5) return { career_preferences: { target_roles: lines(draft.target_roles), industries: lines(draft.industries), locations: lines(draft.locations), job_types: lines(draft.job_types), work_modes: lines(draft.work_modes) } };
  if (step === 6) return { placement_participation: { placement_cycle: value("placement_cycle"), communication_channels: [draft.communication_email && "email", draft.communication_in_app && "in_app"].filter(Boolean), visibility: value("visibility"), privacy_accepted: draft.privacy_accepted } };
  return { review: { confirmed: draft.review_confirmed } };
}

function canSaveStage(stage: number, draft: Draft): boolean {
  const value = (key: string) => String(draft[key] ?? "").trim();
  if (stage === 1) return value("full_name").length >= 2 && value("prn").length >= 2 && value("department").length >= 2 && Number(value("graduation_year")) >= 2000
    && value("degree").length >= 2 && value("branch").length >= 2 && value("education_institution").length >= 2 && value("score") !== "";
  if (stage === 2) return !value("experience_organization") || (value("experience_organization").length >= 2 && value("experience_title").length >= 2 && Boolean(value("experience_start")));
  if (stage === 3) return (!value("project_title") || (value("project_title").length >= 2 && value("project_description").length >= 10)) && (!value("certification_name") || (value("certification_name").length >= 2 && value("certification_issuer").length >= 2));
  if (stage === 4) return lines(draft.target_roles).length > 0;
  return value("placement_cycle").length >= 2 && Boolean(draft.communication_email || draft.communication_in_app) && draft.privacy_accepted === true;
}

export function StudentOnboardingWizard() {
  const router = useRouter();
  const [data, setData] = useState<Onboarding | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveState>("loading");
  const [message, setMessage] = useState("");
  const saving = useRef(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const loaded = await apiRequest<Onboarding>("/onboarding", { cache: "no-store" });
      if (loaded.completed) { router.replace("/dashboard"); return; }
      const serverDraft = hydrate(loaded);
      const stored = window.sessionStorage.getItem(`campushire.onboarding.v2.${loaded.profile_id}`);
      const recovered = stored ? JSON.parse(stored) as { revision: number; step: number; draft: Draft } : null;
      setData(loaded);
      setDraft(recovered?.revision === loaded.revision ? { ...serverDraft, ...recovered.draft } : serverDraft);
      setStep(recovered?.revision === loaded.revision ? Math.min(recovered.step, 5) : onboardingStageForBackendStep(loaded.current_step));
      setDirty(Boolean(recovered?.revision === loaded.revision));
      setMessage(recovered?.revision === loaded.revision ? "Recovered unsaved changes from this tab." : "");
      setState("idle");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Could not load onboarding.");
      setState("error");
    }
  }, [router]);

  useEffect(() => { const timeout = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeout); }, [load]);
  useEffect(() => {
    if (!data || !dirty) return;
    window.sessionStorage.setItem(`campushire.onboarding.v2.${data.profile_id}`, JSON.stringify({ revision: data.revision, step, draft }));
    if (!canSaveStage(step, draft)) return;
    const timeout = window.setTimeout(() => { void save(false); }, 900);
    return () => window.clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, step, data?.revision]);

  async function sendStep(current: Onboarding, backendStep: number, body: object): Promise<Onboarding> {
    return csrfRequest<Onboarding>("/onboarding/step", {
      method: "PUT",
      body: JSON.stringify({ expected_revision: current.revision, step: backendStep, ...body }),
    });
  }

  async function save(advance: boolean) {
    if (!data || saving.current) return;
    if (!canSaveStage(step, draft)) {
      if (!advance) return;
      setState("error");
      setMessage("Complete the required fields for this step. Your tab draft is still saved.");
      return;
    }
    if (!dirty && !advance) return;
    if (!dirty && advance && step < onboardingStageForBackendStep(data.current_step)) {
      setStep((current) => Math.min(current + 1, 5));
      return;
    }

    saving.current = true;
    setState("saving");
    setMessage("");
    try {
      let saved = data;
      const backendSteps = step === 1
        ? [1, 2]
        : step === 5 && advance
          ? (dirty || data.current_step <= 6 ? [6] : [])
          : [step + 1];
      for (const backendStep of backendSteps) {
        saved = await sendStep(saved, backendStep, backendStepBody(backendStep, draft));
      }
      if (step === 5 && advance) {
        saved = await sendStep(saved, 7, backendStepBody(7, draft));
      }
      setData(saved);
      setDirty(false);
      setState("saved");
      window.sessionStorage.removeItem(`campushire.onboarding.v2.${saved.profile_id}`);
      if (saved.completed) {
        setMessage("Onboarding complete. Taking you to your student workspace…");
        router.replace("/dashboard");
      } else if (advance) {
        setStep((current) => Math.min(current + 1, 5));
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setState("conflict"); else setState("error");
      setMessage(cause instanceof ApiError ? cause.message : "Save failed. Your tab draft is still available.");
    } finally { saving.current = false; }
  }

  function change(key: string, value: string | boolean) { setDraft((current) => ({ ...current, [key]: value })); setDirty(true); setState("idle"); }
  function submit(event: FormEvent) { event.preventDefault(); void save(true); }

  if (!data) return (
    <PageContainer context="student" className={styles.page} aria-busy={state === "loading"}>
      <div className={styles.loadingState} role="status" aria-live="polite">
        <h1 className="srOnly">Student onboarding</h1>
        <LoaderCircle aria-hidden="true" />{message || "Loading onboarding…"}
      </div>
    </PageContainer>
  );

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>Student profile</p><h1>Build your evidence once.</h1><span>Five guided steps help your placement team understand your profile. You can add optional details later.</span></div>
      </header>
      <nav className={styles.progress} aria-label="Student onboarding progress">
        <div className={styles.progressMeta}>
          <span>Your progress</span>
          <span>Step {step} of {steps.length}</span>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step} aria-valuetext={`Step ${step} of ${steps.length}: ${steps[step - 1][0]}`}>
          <span style={{ width: `${(step / steps.length) * 100}%` }} />
        </div>
        <ol aria-label="Student onboarding steps">{steps.map(([title], index) => <li key={title} data-state={index + 1 === step ? "current" : index + 1 < step ? "complete" : "upcoming"} aria-current={index + 1 === step ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{title}</li>)}</ol>
      </nav>
      <div className={styles.layout}>
        <section className={styles.panel}>
          <header className={styles.panelHeader}><div><p>Step {step}</p><h2>{steps[step - 1][0]}</h2><span>{steps[step - 1][1]}. Optional fields can be added or updated later.</span></div><div className={styles.saveStatus} data-state={state}><Cloud aria-hidden="true" />{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "conflict" ? "Reload required" : "Autosave on"}</div></header>
          {message ? <Alert tone={state === "error" || state === "conflict" ? "error" : "info"}>{message}{state === "conflict" ? <Button type="button" variant="quiet" onClick={() => void load()}>Reload latest</Button> : null}</Alert> : null}
          <form className={styles.form} onSubmit={submit}>
            {step === 1 ? <>
              <Input id="full_name" label="Full name" value={String(draft.full_name)} onChange={(e) => change("full_name", e.target.value)} required />
              <Input id="institution" label="Institution" value={data.institution_name ?? ""} readOnly aria-readonly="true" />
              <Input id="prn" label="PRN / enrollment ID" value={String(draft.prn)} onChange={(e) => change("prn", e.target.value)} required />
              <Input id="department" label="Department" value={String(draft.department)} onChange={(e) => change("department", e.target.value)} required />
              <Input id="graduation_year" label="Graduation year" type="number" min={2000} max={2100} value={String(draft.graduation_year)} onChange={(e) => change("graduation_year", e.target.value)} required />
              <Input id="degree" label="Degree" value={String(draft.degree)} onChange={(e) => change("degree", e.target.value)} required />
              <Input id="branch" label="Branch" value={String(draft.branch)} onChange={(e) => change("branch", e.target.value)} required />
              <Input id="education_institution" label="Awarding institution" value={String(draft.education_institution)} onChange={(e) => change("education_institution", e.target.value)} required />
              <Input id="start_year" label="Start year (optional)" type="number" value={String(draft.start_year)} onChange={(e) => change("start_year", e.target.value)} />
              <Input id="score" label="CGPA / percentage" type="number" step="0.01" value={String(draft.score)} onChange={(e) => change("score", e.target.value)} required />
              <Select id="score_scale" label="Score scale" value={String(draft.score_scale)} onChange={(e) => change("score_scale", e.target.value)}><option value="cgpa_10">CGPA out of 10</option><option value="percentage">Percentage</option></Select>
              <Input id="active_backlogs" label="Active backlogs" type="number" min={0} value={String(draft.active_backlogs)} onChange={(e) => change("active_backlogs", e.target.value)} required />
            </> : null}
            {step === 2 ? <>
              <Input id="experience_organization" label="Organization (optional)" value={String(draft.experience_organization)} onChange={(e) => change("experience_organization", e.target.value)} />
              <Input id="experience_title" label="Role / internship title (optional)" value={String(draft.experience_title)} onChange={(e) => change("experience_title", e.target.value)} />
              <Input id="experience_start" label="Start date (optional)" type="date" value={String(draft.experience_start)} onChange={(e) => change("experience_start", e.target.value)} />
              <Input id="experience_end" label="End date (leave blank if current)" type="date" value={String(draft.experience_end)} onChange={(e) => change("experience_end", e.target.value)} />
              <label className={styles.fieldRow}>Responsibilities (optional)<textarea value={String(draft.responsibilities)} onChange={(e) => change("responsibilities", e.target.value)} rows={5} /></label>
            </> : null}
            {step === 3 ? <>
              <Input id="project_title" label="Project title (optional)" value={String(draft.project_title)} onChange={(e) => change("project_title", e.target.value)} />
              <Input id="technologies" label="Technologies (comma-separated, optional)" value={String(draft.technologies)} onChange={(e) => change("technologies", e.target.value)} />
              <label className={styles.fieldRow}>Project description (optional)<textarea value={String(draft.project_description)} onChange={(e) => change("project_description", e.target.value)} rows={4} /></label>
              <label className={styles.fieldRow}>Outcomes (one per line, optional)<textarea value={String(draft.outcomes)} onChange={(e) => change("outcomes", e.target.value)} rows={4} /></label>
              <Input id="skills" label="Skills (comma-separated, optional)" value={String(draft.skills)} onChange={(e) => change("skills", e.target.value)} />
              <Input id="certification_name" label="Certification (optional)" value={String(draft.certification_name)} onChange={(e) => change("certification_name", e.target.value)} />
              <Input id="certification_issuer" label="Certification issuer (optional)" value={String(draft.certification_issuer)} onChange={(e) => change("certification_issuer", e.target.value)} />
            </> : null}
            {step === 4 ? <>
              <Input id="target_roles" label="Target roles" hint="Comma-separated" value={String(draft.target_roles)} onChange={(e) => change("target_roles", e.target.value)} required />
              <Input id="industries" label="Industries (optional)" value={String(draft.industries)} onChange={(e) => change("industries", e.target.value)} />
              <Input id="locations" label="Locations (optional)" value={String(draft.locations)} onChange={(e) => change("locations", e.target.value)} />
              <Select id="job_types" label="Job type" value={String(draft.job_types)} onChange={(e) => change("job_types", e.target.value)}><option value="full_time">Full time</option><option value="internship">Internship</option><option value="contract">Contract</option></Select>
              <Select id="work_modes" label="Work mode" value={String(draft.work_modes)} onChange={(e) => change("work_modes", e.target.value)}><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></Select>
            </> : null}
            {step === 5 ? <>
              <Input id="placement_cycle" label="Placement cycle" placeholder="2026–27" value={String(draft.placement_cycle)} onChange={(e) => change("placement_cycle", e.target.value)} required />
              <Select id="visibility" label="Profile visibility" value={String(draft.visibility)} onChange={(e) => change("visibility", e.target.value)}><option value="placement_team">Placement team only</option><option value="participating_recruiters">Placement team and participating recruiters</option></Select>
              <label><input type="checkbox" checked={Boolean(draft.communication_email)} onChange={(e) => change("communication_email", e.target.checked)} /> Email updates</label>
              <label><input type="checkbox" checked={Boolean(draft.communication_in_app)} onChange={(e) => change("communication_in_app", e.target.checked)} /> In-app updates</label>
              <label className={styles.fieldRow}><input type="checkbox" checked={Boolean(draft.privacy_accepted)} onChange={(e) => change("privacy_accepted", e.target.checked)} required /> I accept the placement participation privacy and visibility choices.</label>
              <div className={styles.reviewList}>
                <div><Check aria-hidden="true" /><span><strong>Profile-driven use</strong><small>Reviewed evidence supports matching and optional resume generation. Eligibility remains deterministic.</small></span></div>
                <div><Check aria-hidden="true" /><span><strong>Your information stays under your control</strong><small>Generated wording always requires preview and explicit acceptance.</small></span></div>
                <label><input type="checkbox" checked={Boolean(draft.review_confirmed)} onChange={(e) => change("review_confirmed", e.target.checked)} required /> I reviewed this information and confirm it is accurate.</label>
              </div>
            </> : null}
            <div className={styles.actions}>{step > 1 ? <Button type="button" variant="quiet" onClick={() => setStep((current) => current - 1)}><ArrowLeft aria-hidden="true" /> Back</Button> : null}<Button type="submit" disabled={state === "saving"}>{step === 5 ? "Complete onboarding" : <>Save and continue <ArrowRight aria-hidden="true" /></>}</Button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
