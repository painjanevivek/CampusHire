import { ArrowRight, BriefcaseBusiness, FileText, Route, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/card";

const features = [
  {
    icon: BriefcaseBusiness,
    eyebrow: "Opportunity fit",
    title: "Know why a role fits",
    description: "See formal eligibility separately from a transparent semantic match.",
  },
  {
    icon: FileText,
    eyebrow: "Resume readiness",
    title: "Improve without inventing",
    description: "Review every AI suggestion before it becomes part of your resume.",
  },
  {
    icon: Route,
    eyebrow: "Career direction",
    title: "Follow one clear next step",
    description: "Turn your target role into a reviewed roadmap with visible progress.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <nav className="topbar" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="CampusHire AI home">
            <span className="brandMark" aria-hidden="true">C</span>
            <span>CampusHire AI</span>
          </a>
          <div className="navActions">
            <a className="textLink" href="#how-it-works">How it works</a>
            <ButtonLink href="/sign-in" variant="quiet">Sign in</ButtonLink>
          </div>
        </nav>

        <div id="top" className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow"><ShieldCheck size={16} aria-hidden="true" /> Built for campus placements</p>
            <h1 id="hero-title">Turn preparation into a placement plan.</h1>
            <p className="lede">
              Build a credible profile, understand your best-fit opportunities, and follow a career roadmap that shows exactly what to do next.
            </p>
            <div className="heroActions">
              <ButtonLink href="/sign-up">Create student profile <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
              <ButtonLink href="/admin/sign-in" variant="quiet">TNP access</ButtonLink>
            </div>
            <p className="trustLine">Your achievements stay yours. AI suggestions are reviewable, never silent edits.</p>
          </div>

          <aside className="pathPreview" aria-label="Example placement readiness path">
            <p className="pathLabel">Your placement path</p>
            <ol>
              <li className="complete"><span>01</span><strong>Profile</strong><small>Education and skills ready</small></li>
              <li className="current"><span>02</span><strong>Resume</strong><small>Add one deployed project</small></li>
              <li><span>03</span><strong>Match</strong><small>Discover suitable roles</small></li>
              <li><span>04</span><strong>Roadmap</strong><small>Build the missing evidence</small></li>
            </ol>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="featureSection" aria-labelledby="feature-title">
        <div className="sectionHeading">
          <p className="eyebrow">One connected journey</p>
          <h2 id="feature-title">Insight becomes an action, not another score.</h2>
        </div>
        <div className="featureGrid">
          {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
        </div>
      </section>
    </main>
  );
}
