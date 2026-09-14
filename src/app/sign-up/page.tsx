import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default function SignUpPage() {
  const nextSteps = [
    ["Verify your college", "Connect your account to the institution and placement cycle."],
    ["Complete education", "Add your degree, branch, scores, and backlog evidence."],
    ["Record experience", "Include internships or employment that you want reviewed."],
    ["Present projects & skills", "Add work, technologies, outcomes, and credentials."],
    ["Set preferences", "Choose target roles, locations, job types, and work modes."],
    ["Choose participation", "Set communication, visibility, and privacy choices."],
    ["Review and confirm", "Check your evidence before it supports applications."],
  ] as const;

  return (
    <AuthShell
      eyebrow="Student registration"
      title="Create your CampusHire account."
      description="Start with your basic details. We will verify your email before your student workspace is activated."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
      asideLabel="Information collected after sign-up"
      aside={
        <div className="signUpJourney">
          <p className="pathLabel">What comes next</p>
          <h2>Build your placement profile in seven clear steps.</h2>
          <p className="signUpJourneyIntro">
            You can save your progress and review every detail before it is used.
          </p>
          <ol>
            {nextSteps.map(([title, description], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
