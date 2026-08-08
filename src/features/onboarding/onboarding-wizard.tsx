"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, GitBranch, GraduationCap, Link2, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { csrfRequest } from "@/lib/api/client";

const steps = [
  { title: "Your details", icon: UserRound },
  { title: "Education", icon: GraduationCap },
  { title: "Skills", icon: Sparkles },
  { title: "Target role", icon: ArrowRight },
  { title: "Professional links", icon: Link2 },
  { title: "Review", icon: Check },
];

const roles = ["Software Developer", "Frontend Developer", "Backend Developer", "Full-Stack Developer", "Mobile Application Developer", "Data Analyst", "Machine Learning Engineer", "AI Engineer"];

export function OnboardingWizard() {
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
      setStep((current) => Math.min(current + 1, steps.length - 1));
    } catch {
      setMessage("Sign in to save this step. Your fields remain on this page.");
    }
  }

  return (
    <main id="main-content" className="onboardingPage">
      <header className="wizardHeader"><Link className="brand" href="/"><span className="brandMark" aria-hidden="true">C</span>CampusHire AI</Link><Badge>Autosaves by step</Badge></header>
      <div className="wizardLayout">
        <aside className="stepRail" aria-label="Onboarding progress">
          <p className="pathLabel">Profile setup · {step + 1} of {steps.length}</p>
          <ol>{steps.map((item, index) => <li key={item.title} className={index === step ? "current" : index < step ? "complete" : ""}><item.icon size={18} aria-hidden="true"/><span>{item.title}</span></li>)}</ol>
          <button className="textButton" type="button">Finish later</button>
        </aside>
        <section className="wizardPanel" aria-live="polite">
          <div><p className="eyebrow">{steps[step].title}</p><h1>{step === 0 ? "Build a profile companies can understand." : steps[step].title}</h1><p className="lede">Required information gets you started. Recommended details make matching and roadmaps more useful.</p></div>
          {message && <Alert>{message}</Alert>}
          <form className="wizardForm" onSubmit={save}>
            {step === 0 && <><Input id="full_name" name="full_name" label="Full name" autoComplete="name" required/><Input id="institution_name" name="institution_name" label="Institution" required/><Input id="prn" name="prn" label="PRN or enrolment number" required/><Input id="department" name="department" label="Department" required/><Input id="phone" name="phone" type="tel" label="Phone number (optional)" hint="No OTP or verified label is used in this pilot."/></>}
            {step === 1 && <><Input id="degree" name="degree" label="Degree" required/><Input id="branch" name="branch" label="Branch" required/><div className="fieldRow"><Input id="start_year" name="start_year" type="number" label="Start year" required/><Input id="graduation_year" name="graduation_year" type="number" label="Graduation year" required/></div><Input id="score" name="score" type="number" step="0.01" label="CGPA or percentage" required/></>}
            {step === 2 && <><Input id="skills" name="skills" label="Skills" hint="Add comma-separated skills for now, such as Python, SQL, React."/><Select id="proficiency" name="proficiency" label="Current comfort"><option value="learning">Learning</option><option value="comfortable">Comfortable</option><option value="strong">Strong</option></Select></>}
            {step === 3 && <Select id="target_roles" name="target_roles" label="Primary target role" required><option value="">Select a role…</option>{roles.map((role) => <option key={role}>{role}</option>)}</Select>}
            {step === 4 && <><Input id="github_url" name="github_url" type="url" label="GitHub profile (optional)" placeholder="https://github.com/username" hint="No GitHub yet? Create one when you can—it strengthens technical applications."/><Input id="portfolio_url" name="portfolio_url" type="url" label="Portfolio (optional)" placeholder="https://yourname.dev"/><Alert><GitBranch size={18} aria-hidden="true"/> Links stay optional unless a published role explicitly requires one.</Alert></>}
            {step === 5 && <div className="reviewList"><div><Check aria-hidden="true"/><span><strong>Required profile</strong><small>Identity, education, and target role</small></span></div><div><Sparkles aria-hidden="true"/><span><strong>Recommended next</strong><small>Add skills, professional links, and a PDF resume</small></span></div></div>}
            <div className="wizardActions">{step > 0 && <Button type="button" variant="quiet" onClick={() => setStep(step - 1)}><ArrowLeft size={18}/>Back</Button>}<Button type="submit">{step === steps.length - 1 ? "Finish profile" : "Save and continue"}<ArrowRight size={18}/></Button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
