"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  ChevronDown,
  CircleCheckBig,
  Code2,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import styles from "./opportunities-workspace.module.css";

type Opportunity = {
  title: string;
  company: string;
  mark: string;
  category: "AI/ML" | "Software" | "Data";
  location: string;
  workMode: "Hybrid" | "On-site";
  deadline: string;
  match: number;
  skills: string[];
};

const opportunities: Opportunity[] = [
  {
    title: "AI/ML Intern",
    company: "Nexora Labs",
    mark: "N",
    category: "AI/ML",
    location: "Bengaluru, Karnataka",
    workMode: "Hybrid",
    deadline: "Apply by 25 May 2025",
    match: 92,
    skills: ["AI/ML", "Python", "TensorFlow", "Scikit-learn"],
  },
  {
    title: "Frontend Developer",
    company: "Contour Software",
    mark: "C",
    category: "Software",
    location: "Pune, Maharashtra",
    workMode: "On-site",
    deadline: "Apply by 28 May 2025",
    match: 88,
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  },
  {
    title: "Data Analyst",
    company: "Insite Analytics",
    mark: "I",
    category: "Data",
    location: "Hyderabad, Telangana",
    workMode: "Hybrid",
    deadline: "Apply by 30 May 2025",
    match: 85,
    skills: ["SQL", "Python", "Excel", "Power BI"],
  },
];

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className={styles.filter}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

export function OpportunitiesWorkspace() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [location, setLocation] = useState("All locations");
  const [workMode, setWorkMode] = useState("All modes");
  const [skill, setSkill] = useState("All skills");

  const matches = useMemo(() => opportunities.filter((opportunity) => {
    const searchable = `${opportunity.title} ${opportunity.company} ${opportunity.skills.join(" ")}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (role === "All roles" || opportunity.category === role)
      && (location === "All locations" || opportunity.location.includes(location))
      && (workMode === "All modes" || opportunity.workMode === workMode)
      && (skill === "All skills" || opportunity.skills.includes(skill));
  }), [location, query, role, skill, workMode]);

  const highlight = matches[0] ?? opportunities[0];
  const clearFilters = () => {
    setQuery("");
    setRole("All roles");
    setLocation("All locations");
    setWorkMode("All modes");
    setSkill("All skills");
  };

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Eligible roles / updated daily</p>
          <h1>Find work that fits your <em>evidence.</em></h1>
          <p className={styles.lede}>Formal eligibility comes first. Match guidance then explains where your reviewed profile aligns.</p>
        </div>
        <Link href="#saved-roles" className={styles.secondaryAction}>
          <Bookmark size={17} aria-hidden="true" /> Saved roles
        </Link>
      </header>

      <section className={styles.searchPanel} aria-label="Find opportunities">
        <label className={styles.search}>
          <Search size={21} aria-hidden="true" />
          <span className={styles.srOnly}>Search opportunities</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by role, company, or skill"
            aria-label="Search opportunities"
          />
        </label>
        <div className={styles.filters} aria-label="Opportunity filters">
          <FilterSelect label="Role" value={role} onChange={setRole} options={["All roles", "AI/ML", "Software", "Data"]} />
          <FilterSelect label="Location" value={location} onChange={setLocation} options={["All locations", "Bengaluru", "Pune", "Hyderabad"]} />
          <FilterSelect label="Mode" value={workMode} onChange={setWorkMode} options={["All modes", "Hybrid", "On-site"]} />
          <FilterSelect label="Skill" value={skill} onChange={setSkill} options={["All skills", "Python", "React", "SQL"]} />
          <button type="button" className={styles.clear} onClick={clearFilters} aria-label="Clear filters">
            <RotateCcw size={16} aria-hidden="true" /> Clear filters
          </button>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.results} aria-labelledby="eligible-roles-title">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Formal checks passed</p>
              <h2 id="eligible-roles-title">Eligible opportunities</h2>
            </div>
            <span className={styles.count}>{matches.length.toString().padStart(2, "0")} roles</span>
          </header>

          <div className={styles.list}>
            {matches.map((opportunity) => (
              <article
                className={styles.card}
                key={opportunity.title}
                aria-label={`${opportunity.title} at ${opportunity.company}`}
              >
                <span className={styles.companyMark} aria-hidden="true">{opportunity.mark}</span>
                <div className={styles.identity}>
                  <p>{opportunity.company}</p>
                  <h3>{opportunity.title}</h3>
                  <div className={styles.meta}>
                    <span><MapPin size={14} aria-hidden="true" />{opportunity.location}</span>
                    <span><CalendarDays size={14} aria-hidden="true" />{opportunity.deadline}</span>
                  </div>
                  <div className={styles.skills}>{opportunity.skills.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
                <div className={styles.decision}>
                  <span className={styles.eligible}><BadgeCheck size={16} aria-hidden="true" />Formally eligible</span>
                  <strong>{opportunity.match}% match</strong>
                  <span>Decision support</span>
                </div>
                <Link className={styles.viewRole} href="/opportunities/demo" aria-label={`View ${opportunity.title}`}>
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </article>
            ))}
            {!matches.length && (
              <div className={styles.empty} role="status">
                <Search size={25} aria-hidden="true" />
                <div><strong>No eligible roles match these filters.</strong><p>Clear the filters or add stronger profile evidence to widen the list.</p></div>
              </div>
            )}
          </div>
          <p className={styles.disclaimer}>Match is decision support, not hiring probability.</p>
        </section>

        <aside className={styles.insight} aria-labelledby="match-explanation-title">
          <div className={styles.insightLabel}><span className={styles.liveDot} /> Profile signal / live</div>
          <Sparkles className={styles.sparkle} size={22} aria-hidden="true" />
          <h2 id="match-explanation-title">Why this role matches</h2>
          <div className={styles.insightRole}>
            <span className={styles.companyMark} aria-hidden="true">{highlight.mark}</span>
            <div><strong>{highlight.title}</strong><span>{highlight.company}</span></div>
            <b>{highlight.match}%</b>
          </div>
          <div className={styles.terminal}>
            <div className={styles.terminalBar}><i /><i /><i /><span>match-evidence.ts</span></div>
            <p><Code2 size={15} aria-hidden="true" /><span>formalEligibility</span>: <b>true</b></p>
            <p><CircleCheckBig size={15} aria-hidden="true" /><span>skills</span>: {highlight.skills.slice(0, 2).join(", ")}</p>
            <p><TrendingUp size={15} aria-hidden="true" /><span>nextProof</span>: deployment project</p>
          </div>
          <p className={styles.insightCopy}>Your reviewed skills and project evidence align with the core requirements. Add deployment evidence to make the explanation stronger.</p>
          <Link className={styles.insightLink} href="/roadmap">Improve this match <ArrowRight size={17} aria-hidden="true" /></Link>
        </aside>
      </div>
    </main>
  );
}
