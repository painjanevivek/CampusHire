"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  GitBranch,
  GraduationCap,
  Link2,
  LoaderCircle,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import { trackProductEvent } from "@/lib/product-analytics";
import styles from "./onboarding-wizard.module.css";

const steps = [
  { title: "Identity", icon: UserRound },
  { title: "Education", icon: GraduationCap },
  { title: "Skills", icon: Sparkles },
  { title: "Target role", icon: ArrowRight },
  { title: "Professional links", icon: Link2 },
  { title: "Review", icon: Check },
];

const roles = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Mobile Application Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "AI Engineer",
];

type Profile = {
  full_name: string | null;
  institution_name: string | null;
  prn: string | null;
  department: string | null;
  academic_year: string | null;
  phone: string | null;
  education: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  target_roles: string[];
  external_links: Record<string, string>;
  onboarding_step: number;
  revision: number;
  readiness: number;
  is_complete: boolean;
};

type Draft = Record<string, string>;
type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";

const emptyDraft: Draft = {
  full_name: "",
  institution_name: "",
  prn: "",
  department: "",
  academic_year: "",
  phone: "",
  degree: "",
  branch: "",
  education_institution: "",
  start_year: "",
  graduation_year: "",
  score: "",
  score_scale: "cgpa_10",
  skills: "",
  proficiency: "comfortable",
  target_roles: "",
  github_url: "",
  portfolio_url: "",
};

function hydrateDraft(profile: Profile): Draft {
  const education = profile.education[0] ?? {};
  const firstSkill = profile.skills[0] ?? {};
  return {
    ...emptyDraft,
    full_name: profile.full_name ?? "",
    institution_name: profile.institution_name ?? "",
    prn: profile.prn ?? "",
    department: profile.department ?? "",
    academic_year: profile.academic_year ?? "",
    phone: profile.phone ?? "",
    degree: String(education.degree ?? ""),
    branch: String(education.branch ?? ""),
    education_institution: String(education.institution ?? profile.institution_name ?? ""),
    start_year: String(education.start_year ?? ""),
    graduation_year: String(education.graduation_year ?? ""),
    score: String(education.score ?? ""),
    score_scale: String(education.score_scale ?? "cgpa_10"),
    skills: profile.skills.map((item) => String(item.name ?? "")).filter(Boolean).join(", "),
    proficiency: String(firstSkill.proficiency ?? "comfortable"),
    target_roles: profile.target_roles[0] ?? "",
    github_url: profile.external_links.github ?? "",
    portfolio_url: profile.external_links.portfolio ?? "",
  };
}

function requestForStep(step: number, draft: Draft, revision: number, advance: boolean) {
  const onboarding_step = advance ? Math.min(step + 2, steps.length) : step + 1;
  const base = { expected_revision: revision, onboarding_step };
  if (step === 0) {
    return {
      path: "/profile/identity",
      method: "PATCH",
      body: {
        ...base,
        full_name: draft.full_name || null,
        institution_name: draft.institution_name || null,
        prn: draft.prn || null,
        department: draft.department || null,
        academic_year: draft.academic_year || null,
        phone: draft.phone || null,
      },
    };
  }
  if (step === 1) {
    return {
      path: "/profile/education",
      method: "PUT",
      body: {
        ...base,
        education: [{
          degree: draft.degree,
          branch: draft.branch,
          institution: draft.education_institution || draft.institution_name,
          start_year: Number(draft.start_year),
          graduation_year: Number(draft.graduation_year),
          score: Number(draft.score),
          score_scale: draft.score_scale,
        }],
      },
    };
  }
  if (step === 2) {
    return {
      path: "/profile/skills",
      method: "PUT",
      body: {
        ...base,
        skills: draft.skills.split(",").map((name) => name.trim()).filter(Boolean)
          .map((name) => ({ name, proficiency: draft.proficiency })),
      },
    };
  }
  if (step === 3) {
    return {
      path: "/profile/preferences",
      method: "PUT",
      body: { ...base, target_roles: [draft.target_roles] },
    };
  }
  if (step === 4) {
    return {
      path: "/profile/links",
      method: "PUT",
      body: {
        ...base,
        github_url: draft.github_url || null,
        portfolio_url: draft.portfolio_url || null,
      },
    };
  }
  return { path: "/profile", method: "PATCH", body: base };
}

export function OnboardingWizard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await apiRequest<Profile>("/profile", { cache: "no-store" });
      setProfile(loaded);
      setDraft(hydrateDraft(loaded));
      setStep(Math.min(Math.max(loaded.onboarding_step - 1, 0), steps.length - 1));
      setSaveState("idle");
      setMessage("");
    } catch {
      setMessage("We could not load your saved profile. Retry when your connection is available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadProfile(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadProfile]);

  const persist = useCallback(async (advance: boolean) => {
    if (!profile || savingRef.current) return false;
    savingRef.current = true;
    setSaveState("saving");
    const request = requestForStep(step, draft, profile.revision, advance);
    try {
      const saved = await csrfRequest<Profile>(request.path, {
        method: request.method,
        body: JSON.stringify(request.body),
      });
      setProfile(saved);
      setDirty(false);
      setSaveState("saved");
      setMessage("");
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSaveState("conflict");
        setMessage("This profile changed in another session. Your current fields are still here; reload the saved version before continuing.");
      } else {
        setSaveState("error");
        setMessage("We could not save this step. Your fields remain here; try again.");
      }
      return false;
    } finally {
      savingRef.current = false;
    }
  }, [draft, profile, step]);

  useEffect(() => {
    if (!dirty || loading || step === steps.length - 1) return;
    const timeout = window.setTimeout(() => {
      if (formRef.current?.checkValidity()) void persist(false);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [dirty, draft, loading, persist, step]);

  function update(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
    setDirty(true);
    setSaveState("idle");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await persist(true);
    if (!saved) return;
    if (step === steps.length - 1) {
      trackProductEvent("profile_complete");
      router.push("/opportunities");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finishLater() {
    if (!dirty || (formRef.current?.checkValidity() && await persist(false))) {
      router.push("/dashboard");
    }
  }

  const field = (name: string) => ({ name, value: draft[name], onChange: update });

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>Evidence profile / resumable</p><h1>Create your profile</h1><span>Add only the facts CampusHire needs to explain eligibility and role relevance.</span></div>
        <div className={styles.stepCount}><strong>{String(step + 1).padStart(2, "0")}</strong><span>of 06<br />steps</span></div>
      </header>

      <div className={styles.layout} aria-busy={loading}>
        <nav className={styles.stepRail} aria-label="Profile steps">
          <p>Step {step + 1} of {steps.length}</p>
          <ol tabIndex={0} aria-label="Profile setup progress">{steps.map((item, index) => (
            <li key={item.title} data-state={index === step ? "current" : index < step ? "complete" : "pending"}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <item.icon size={17} aria-hidden="true" />
              <strong>{item.title}</strong>
            </li>
          ))}</ol>
          <button type="button" onClick={() => void finishLater()}>Finish later</button>
        </nav>

        <section className={styles.panel} aria-live="polite">
          <div className={styles.panelHeader}>
            <div>
              <p>Profile input / {String(step + 1).padStart(2, "0")}</p>
              <h2>{step === 0 ? "Your foundation." : steps[step].title}</h2>
              <span>Required fields are labelled. Optional details never block completion.</span>
            </div>
            <div className={styles.saveStatus} data-state={saveState} role="status">
              {saveState === "saving" ? <LoaderCircle size={15} aria-hidden="true" /> : <Cloud size={15} aria-hidden="true" />}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "conflict" ? "Needs review" : "Autosave ready"}
            </div>
          </div>
          {message && <Alert tone={saveState === "conflict" ? "warning" : "error"}>{message}{saveState === "conflict" && <button type="button" className={styles.inlineAction} onClick={() => void loadProfile()}>Reload saved profile</button>}</Alert>}
          {loading ? (
            <div className={styles.loadingState} role="status"><LoaderCircle aria-hidden="true" /> Loading your saved profile…</div>
          ) : (
            <form ref={formRef} className={styles.form} onSubmit={save}>
              {step === 0 && <><Input id="full_name" label="Full name" autoComplete="name" required {...field("full_name")} /><Input id="institution_name" label="Institution" required {...field("institution_name")} /><Input id="prn" label="PRN or enrolment number" required {...field("prn")} /><Input id="department" label="Department" required {...field("department")} /><Input id="academic_year" label="Academic year (optional)" placeholder="2026–27" {...field("academic_year")} /><Input id="phone" type="tel" label="Phone number (optional)" hint="No OTP or verified label is used in this pilot." {...field("phone")} /></>}
              {step === 1 && <><Input id="degree" label="Degree" required {...field("degree")} /><Input id="branch" label="Branch" required {...field("branch")} /><Input id="education_institution" label="Awarding institution" required {...field("education_institution")} /><div className={styles.fieldRow}><Input id="start_year" type="number" label="Start year" required {...field("start_year")} /><Input id="graduation_year" type="number" label="Graduation year" required {...field("graduation_year")} /></div><Input id="score" type="number" step="0.01" label="Current score" required {...field("score")} /><Select id="score_scale" label="Score scale" {...field("score_scale")}><option value="cgpa_10">CGPA / 10</option><option value="percentage">Percentage</option></Select></>}
              {step === 2 && <><Input id="skills" label="Skills (optional)" hint="Comma-separated, such as Python, SQL, React." {...field("skills")} /><Select id="proficiency" label="Current comfort" {...field("proficiency")}><option value="learning">Learning</option><option value="comfortable">Comfortable</option><option value="strong">Strong</option></Select></>}
              {step === 3 && <Select id="target_roles" label="Primary target role" required {...field("target_roles")}><option value="">Select a role…</option>{roles.map((role) => <option key={role}>{role}</option>)}</Select>}
              {step === 4 && <><Input id="github_url" type="url" label="GitHub profile (optional)" placeholder="https://github.com/username" hint="Use a complete GitHub profile URL." {...field("github_url")} /><Input id="portfolio_url" type="url" label="Portfolio (optional)" placeholder="https://yourname.dev" {...field("portfolio_url")} /><Alert><GitBranch size={18} aria-hidden="true" /> Links stay optional unless a published role explicitly requires one.</Alert></>}
              {step === 5 && <div className={styles.reviewList}><div><Check aria-hidden="true" /><span><strong>Minimum onboarding</strong><small>Identity, education, and a target role determine completion.</small></span></div><div><Sparkles aria-hidden="true" /><span><strong>{profile?.readiness ?? 0}% evidence readiness</strong><small>Skills, links, and a reviewed PDF remain recommended—not silently required.</small></span></div></div>}
              <div className={styles.actions}>{step > 0 && <Button type="button" variant="quiet" onClick={() => setStep(step - 1)}><ArrowLeft size={18} aria-hidden="true" /> Back</Button>}<Button type="submit" disabled={saveState === "saving"}>{step === steps.length - 1 ? "Finish profile" : "Save and continue"}<ArrowRight size={18} aria-hidden="true" /></Button></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
