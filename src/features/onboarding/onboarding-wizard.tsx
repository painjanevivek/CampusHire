"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, GitBranch, GraduationCap, Link2, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { csrfRequest } from "@/lib/api/client";
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

const roles = ["Software Developer", "Frontend Developer", "Backend Developer", "Full-Stack Developer", "Mobile Application Developer", "Data Analyst", "Machine Learning Engineer", "AI Engineer"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries([...form.entries()].filter(([, value]) => value !== ""));
    let body: Record<string, unknown> = values;
    if (step === 1) body = { education: [{ ...values, start_year: Number(values.start_year), graduation_year: Number(values.graduation_year), score: Number(values.score), score_scale: "cgpa_10", institution: values.institution ?? "Current institution" }] };
    if (step === 2) body = { skills: String(values.skills ?? "").split(",").map((name) => ({ name: name.trim(), proficiency: values.proficiency })).filter((item) => item.name) };
    if (step === 3) body = { target_roles: [values.target_roles] };
    body.onboarding_step = Math.min(step + 2, steps.length);
    try {
      await csrfRequest("/profile", { method: "PATCH", body: JSON.stringify(body) });
      setMessage("");
      if (step === steps.length - 1) {
        trackProductEvent("profile_complete");
        router.push("/opportunities");
        return;
      }
      setStep((current) => Math.min(current + 1, steps.length - 1));
    } catch {
      setMessage("We could not save this step. Your fields remain here; try again.");
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div><p>Evidence profile / autosaved</p><h1>Build a profile teams can <em>trust.</em></h1><span>Required information gets you started. Reviewed evidence makes matching and roadmaps more useful.</span></div>
        <div className={styles.stepCount}><strong>{String(step + 1).padStart(2, "0")}</strong><span>of 06<br />steps</span></div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.stepRail} aria-label="Profile steps">
          <p>Step {step + 1} of {steps.length}</p>
          <ol>{steps.map((item, index) => (
            <li key={item.title} data-state={index === step ? "current" : index < step ? "complete" : "pending"}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <item.icon size={17} aria-hidden="true" />
              <strong>{item.title}</strong>
            </li>
          ))}</ol>
          <button type="button">Finish later</button>
        </nav>

        <section className={styles.panel} aria-live="polite">
          <div className={styles.panelHeader}><p>Profile input / {String(step + 1).padStart(2, "0")}</p><h2>{step === 0 ? "Your foundation." : steps[step].title}</h2><span>Required fields are labelled. Optional details never block completion.</span></div>
          {message && <Alert tone="error">{message}</Alert>}
          <form className={styles.form} onSubmit={save}>
            {step === 0 && <><Input id="full_name" name="full_name" label="Full name" autoComplete="name" required /><Input id="institution_name" name="institution_name" label="Institution" required /><Input id="prn" name="prn" label="PRN or enrolment number" required /><Input id="department" name="department" label="Department" required /><Input id="phone" name="phone" type="tel" label="Phone number (optional)" hint="No OTP or verified label is used in this pilot." /></>}
            {step === 1 && <><Input id="degree" name="degree" label="Degree" required /><Input id="branch" name="branch" label="Branch" required /><div className={styles.fieldRow}><Input id="start_year" name="start_year" type="number" label="Start year" required /><Input id="graduation_year" name="graduation_year" type="number" label="Graduation year" required /></div><Input id="score" name="score" type="number" step="0.01" label="CGPA or percentage" required /></>}
            {step === 2 && <><Input id="skills" name="skills" label="Skills" hint="Add comma-separated skills for now, such as Python, SQL, React." /><Select id="proficiency" name="proficiency" label="Current comfort"><option value="learning">Learning</option><option value="comfortable">Comfortable</option><option value="strong">Strong</option></Select></>}
            {step === 3 && <Select id="target_roles" name="target_roles" label="Primary target role" required><option value="">Select a role…</option>{roles.map((role) => <option key={role}>{role}</option>)}</Select>}
            {step === 4 && <><Input id="github_url" name="github_url" type="url" label="GitHub profile (optional)" placeholder="https://github.com/username" hint="No GitHub yet? Create one when you can—it strengthens technical applications." /><Input id="portfolio_url" name="portfolio_url" type="url" label="Portfolio (optional)" placeholder="https://yourname.dev" /><Alert><GitBranch size={18} aria-hidden="true" /> Links stay optional unless a published role explicitly requires one.</Alert></>}
            {step === 5 && <div className={styles.reviewList}><div><Check aria-hidden="true" /><span><strong>Required profile</strong><small>Identity, education, and target role</small></span></div><div><Sparkles aria-hidden="true" /><span><strong>Recommended next</strong><small>Add skills, professional links, and a PDF resume</small></span></div></div>}
            <div className={styles.actions}>{step > 0 && <Button type="button" variant="quiet" onClick={() => setStep(step - 1)}><ArrowLeft size={18} aria-hidden="true" /> Back</Button>}<Button type="submit">{step === steps.length - 1 ? "Finish profile" : "Save and continue"}<ArrowRight size={18} aria-hidden="true" /></Button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
